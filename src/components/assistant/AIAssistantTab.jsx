import { useState, useEffect, useRef } from 'react';
import {
  Send, RefreshCw, Mic, MicOff,
  Bot, ShieldCheck
} from 'lucide-react';
import { env } from '../../config/env';
import { answerQuery } from '../../services/agents/assistantAgent';
import { buildFinancialSnapshot } from '../../services/agents/managerAgent';
import { createWebSpeechRecognition } from '../../services/agents/voiceAgent';
import { useBudget } from '../../contexts/BudgetContext';
import { useAuth } from '../../contexts/AuthContext';
import VoiceAuditLogModal from './VoiceAuditLogModal';
import Reveal from '../ui/Reveal';
import { toast } from 'react-hot-toast';
import { checkAndIncrementQuota, QUOTA_LIMITS, getNextMondayCountdown } from '../../utils/quotaManager';

// ── Markdown rendering helpers ──────────────────────────────────────────────

function formatInlineMarkdown(str) {
  if (!str) return '';
  return String(str)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-zinc-400 font-normal">$1</em>');
}

function renderMarkdownText(text) {
  if (!text) return null;
  const paragraphs = String(text).split('\n\n');

  return (
    <div className="space-y-3 text-sm text-zinc-200 leading-relaxed font-sans">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              if (line.startsWith('• ') || line.startsWith('- ')) {
                const content = line.substring(2);
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-2 my-1 text-xs text-zinc-300">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
                  </div>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                const content = line.replace(/^\d+\.\s/, '');
                const num = line.match(/^(\d+)\./)[1];
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-2 my-1 text-xs text-zinc-300">
                    <span className="text-accent font-bold mt-0.5 min-w-[16px]">{num}.</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
                  </div>
                );
              }
              if (line.startsWith('**') && line.endsWith(':**')) {
                return (
                  <h4 key={lIdx} className="font-semibold text-accent text-xs uppercase tracking-wider pt-2 border-t border-zinc-800/60 mt-2">
                    {line.replace(/\*\*/g, '')}
                  </h4>
                );
              }
              if (line.startsWith('###') || line.startsWith('##')) {
                return (
                  <h4 key={lIdx} className="font-semibold text-text text-sm pt-1">
                    {line.replace(/^#+\s*/, '')}
                  </h4>
                );
              }
              return (
                <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Agent Pipeline Indicator ────────────────────────────────────────────────

function AgentPipelineBadge({ metrics }) {
  if (!metrics?.sources || metrics.sources.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-text-muted">
      <span className="font-semibold text-accent">Sources:</span>
      {metrics.sources.slice(0, 3).map((s, i) => (
        <a
          key={i}
          href={s.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-accent underline truncate max-w-[200px]"
        >
          {s.title || s.uri}
        </a>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AIAssistantTab() {
  const budgetState = useBudget();
  const { user } = useAuth();

  const { dispatch } = budgetState;
  const messages = budgetState.chatMessages || [];

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVoiceAuditLog, setShowVoiceAuditLog] = useState(false);
  const [isVoicePrompting, setIsVoicePrompting] = useState(false);
  const [isTranscribingPrompt, setIsTranscribingPrompt] = useState(false);

  const assistantUsed = budgetState.quotaUsage?.assistantUsed ?? 0;
  const remainingQueries = Math.max(0, (QUOTA_LIMITS.assistant || 10) - assistantUsed);

  const chatEndRef = useRef(null);
  const promptMediaRecorderRef = useRef(null);
  const promptAudioChunksRef = useRef([]);
  const promptRecognitionRef = useRef(null);
  const welcomeDispatchedRef = useRef(false);
  const hasUserSubmittedRef = useRef(false);

  const handleStartPromptVoice = async () => {
    // Pre-validate voice quota for non-subscribed users before starting recording
    if (!budgetState.isSubscribed) {
      const quotaCheck = await checkAndIncrementQuota(user?.uid, 'voice', budgetState.quotaUsage, {
        skipIncrement: true,
        isSubscribed: Boolean(budgetState.isSubscribed),
      });
      if (!quotaCheck.allowed) {
        budgetState.openProModal({
          reason: 'QUOTA_EXHAUSTED',
          feature: 'voice',
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          resetCountdown: quotaCheck.resetCountdown,
        });
        return;
      }
    }

    setIsVoicePrompting(true);
    promptAudioChunksRef.current = [];

    // 1. Web Speech API for real-time live typing feedback
    try {
      const recognition = createWebSpeechRecognition(
        (text) => {
          if (text) {
            setInputQuery(text);
          }
        },
        (err) => {
          console.warn('[AI Prompt Voice] WebSpeech event warning:', err);
        },
        () => {}
      );
      if (recognition) {
        promptRecognitionRef.current = recognition;
        recognition.start();
      }
    } catch (_) {}

    // 2. Native MediaRecorder for full audio recording + transcription
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      promptMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          promptAudioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(promptAudioChunksRef.current, { type: mimeType });
        await handleTranscribeAndPromptAI(audioBlob);
      };

      mediaRecorder.start(100);
    } catch (err) {
      console.warn('[AI Prompt Voice] Mic access error:', err);
      setIsVoicePrompting(false);
      toast.error('Microphone permission denied or not available. Please allow mic access or type below.');
    }
  };

  const handleStopPromptVoice = () => {
    setIsVoicePrompting(false);

    if (promptRecognitionRef.current) {
      try { promptRecognitionRef.current.stop(); } catch (_) {}
    }

    if (promptMediaRecorderRef.current && promptMediaRecorderRef.current.state !== 'inactive') {
      try {
        promptMediaRecorderRef.current.requestData();
        promptMediaRecorderRef.current.stop();
      } catch (_) {}
    }
  };

  const handleTranscribeAndPromptAI = async (audioBlob) => {
    let capturedText = '';

    if (audioBlob && audioBlob.size > 100) {
      setIsTranscribingPrompt(true);
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'prompt-recording.webm');
        formData.append('mode', 'prompt');

        const apiBase = env.apiBaseUrl || '';
        const response = await fetch(`${apiBase}/api/voice/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          if (response.status === 429 || errJson.error === 'UPSTREAM_RATE_LIMIT') {
            budgetState.openProModal({
              reason: 'UPSTREAM_RATE_LIMIT',
              feature: 'voice',
              used: budgetState.quotaUsage?.voiceUsed ?? QUOTA_LIMITS.voice,
              limit: QUOTA_LIMITS.voice,
              resetCountdown: getNextMondayCountdown(),
            });
            return;
          }
        }

        if (response.ok) {
          const data = await response.json();
          await budgetState.updateQuota('voice');
          if (data.transcript) {
            capturedText = data.transcript;
          }
        }
      } catch (err) {
        console.warn('[Voice Prompt] Audio transcription error:', err);
      } finally {
        setIsTranscribingPrompt(false);
      }
    }

    // Fallback to WebSpeech live text if audio transcription didn't return text
    if (!capturedText && inputQuery.trim()) {
      capturedText = inputQuery.trim();
    }

    if (capturedText) {
      setInputQuery(capturedText);
      toast.success('Voice prompt transcribed!');
      handleSendQuery(capturedText);
    } else {
      toast.error('Could not transcribe audio. Please try speaking again or type your question.');
    }
  };

  // Build financial snapshot for the AI Assistant
  const financialSnapshot = buildFinancialSnapshot(budgetState);

  // Clean, concise greeting if chat history is empty
  useEffect(() => {
    const hasWelcome = messages.some((m) => m.id === 'msg_welcome' || m.text?.includes("financial assistant") || m.text?.includes("AI Financial Assistant"));
    if (messages.length === 0 && !welcomeDispatchedRef.current && !hasWelcome) {
      welcomeDispatchedRef.current = true;
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          id: 'msg_welcome',
          sender: 'assistant',
          source: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Hello! What would you like to review in your budget today?',
        }
      });
    }
  }, [messages, dispatch, user?.displayName]);

  // Smooth scroll to bottom ONLY when user actively sends a message or receives an AI answer
  useEffect(() => {
    if (hasUserSubmittedRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isProcessing]);

  // ── Handle text question ────────────────────────────────────────────────

  const handleSendQuery = async (queryToRun) => {
    const query = (queryToRun || inputQuery).trim();
    if (!query || isProcessing) return;

    // Pre-validate quota for non-subscribed users
    if (!budgetState.isSubscribed) {
      const quotaCheck = await checkAndIncrementQuota(user?.uid, 'assistant', budgetState.quotaUsage, {
        skipIncrement: true,
        isSubscribed: Boolean(budgetState.isSubscribed),
      });
      if (!quotaCheck.allowed) {
        budgetState.openProModal({
          reason: 'QUOTA_EXHAUSTED',
          feature: 'assistant',
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          resetCountdown: quotaCheck.resetCountdown,
        });
        return;
      }
    }

    hasUserSubmittedRef.current = true;
    setInputQuery('');
    const userMsgId = `user_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append user message
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });

    setIsProcessing(true);

    try {
      const result = await answerQuery(query, financialSnapshot);

      // Intercept 429 rate limit or quota exhaustion from upstream
      if (result.isRateLimit || result.status === 429) {
        budgetState.openProModal({
          reason: 'UPSTREAM_RATE_LIMIT',
          feature: 'assistant',
          used: budgetState.quotaUsage?.assistantUsed ?? QUOTA_LIMITS.assistant,
          limit: QUOTA_LIMITS.assistant,
          resetCountdown: getNextMondayCountdown(),
        });
        return;
      }

      if (!budgetState.isSubscribed) {
        await budgetState.updateQuota('assistant');
      }

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        source: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: result.answer,
        metrics: result.metrics,
      };

      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMsg });
    } catch (error) {
      console.error('Assistant query error:', error);
      if (error.status === 429 || error?.data?.error === 'UPSTREAM_RATE_LIMIT' || error?.message?.includes('429')) {
        budgetState.openProModal({
          reason: 'UPSTREAM_RATE_LIMIT',
          feature: 'assistant',
          used: budgetState.quotaUsage?.assistantUsed ?? QUOTA_LIMITS.assistant,
          limit: QUOTA_LIMITS.assistant,
          resetCountdown: getNextMondayCountdown(),
        });
        return;
      }
      toast.error('Failed to process your question.');
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          id: `error_${Date.now()}`,
          sender: 'assistant',
          source: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'I apologize, but I encountered an error. Please try again.',
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Voice Audit Log Inspector Modal */}
      <VoiceAuditLogModal
        isOpen={showVoiceAuditLog}
        onClose={() => setShowVoiceAuditLog(false)}
      />

      {/* ── Sleek, minimal header (No wall-of-text, no promotional badges) ── */}
      <Reveal delay={0} y={16}>
        <div data-tutorial="ai-header-tools" className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-card-hover border border-border flex items-center justify-center text-text shrink-0">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Financial Assistant
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {budgetState.isSubscribed ? (
              <span className="text-[11px] bg-accent/20 text-accent font-semibold px-3 py-1 rounded-full border border-accent/40 flex items-center gap-1.5 shadow-sm">
                ARCA Pro • Unlimited
              </span>
            ) : (
              <button
                type="button"
                onClick={() => budgetState.openProModal({
                  reason: 'QUOTA_EXHAUSTED',
                  feature: 'assistant',
                  used: assistantUsed,
                  limit: QUOTA_LIMITS.assistant,
                  resetCountdown: getNextMondayCountdown(),
                })}
                className="text-[11px] bg-accent/15 hover:bg-accent/25 text-accent font-semibold px-3 py-1 rounded-full border border-accent/30 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="Weekly AI Assistant Quota"
              >
                {remainingQueries}/{QUOTA_LIMITS.assistant} queries left • Resets Mon
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowVoiceAuditLog(true)}
              className="text-xs bg-card-hover hover:bg-card text-zinc-300 border border-border px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Inspect voice transcripts & logs"
            >
              <ShieldCheck size={13} className="text-accent" />
              <span>Voice Logs</span>
            </button>

            <button
              type="button"
              onClick={() => dispatch({ type: 'CLEAR_CHAT_MESSAGES' })}
              title="Clear chat messages"
              className="text-xs text-zinc-400 hover:text-white hover:bg-card-hover px-2.5 py-1 rounded-lg transition-colors border border-border cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </Reveal>

      {/* Main Chat Stream Container */}
      <Reveal delay={0.1} y={20}>
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 min-h-[460px] flex flex-col justify-between shadow-xl">
          <div className="space-y-6 overflow-y-auto max-h-[580px] pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2">
                {msg.sender === 'user' ? (
                  /* User Message Bubble */
                  <div className="flex justify-end">
                    <div className="max-w-lg rounded-2xl rounded-tr-xs px-4 py-3 text-sm bg-accent/10 border border-accent/20 text-text shadow-sm">
                      <p className="font-medium">{msg.text}</p>
                      <span className="text-[10px] block text-right mt-1 text-accent/60">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Assistant Response Box */
                  <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-md transition-all duration-300 ease-out">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center shadow-inner">
                          <Bot size={13} />
                        </div>
                        <span className="text-xs font-semibold text-text">Financial Advisor</span>
                      </div>
                      <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
                    </div>

                    {msg.metrics && (
                      <AgentPipelineBadge metrics={msg.metrics} />
                    )}

                    <div className="pt-1">
                      {renderMarkdownText(msg.text)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center space-x-2 text-xs text-text-muted bg-card p-4 rounded-xl border border-border animate-pulse transition-all duration-300">
                <RefreshCw size={14} className="animate-spin text-accent" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Voice Prompt Recording Status Banner */}
          {isVoicePrompting && (
            <div className="mt-3 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-medium">Recording voice prompt... Speak your question into the mic.</span>
              </div>
              <button
                type="button"
                onClick={handleStopPromptVoice}
                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Done / Send
              </button>
            </div>
          )}

          {isTranscribingPrompt && (
            <div className="mt-3 px-3.5 py-2.5 bg-accent/10 border border-accent/30 rounded-xl flex items-center space-x-2 text-xs text-accent">
              <RefreshCw size={14} className="animate-spin text-accent" />
              <span className="font-medium">Transcribing voice prompt...</span>
            </div>
          )}

          {/* Input Bar */}
          <div data-tutorial="ai-input-bar" className="mt-4 pt-3 border-t border-border flex items-center space-x-2 transition-all duration-500 ease-out animate-in fade-in">
            {/* Voice prompt mic button */}
            <button
              type="button"
              data-tutorial="ai-voice-mic"
              onClick={isVoicePrompting ? handleStopPromptVoice : handleStartPromptVoice}
              disabled={isProcessing || isTranscribingPrompt}
              className={`p-3 rounded-xl transition-all border cursor-pointer ${
                isVoicePrompting
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/20 animate-pulse scale-105'
                  : isTranscribingPrompt
                  ? 'bg-accent/20 text-accent border-accent/40 opacity-80'
                  : 'bg-primary text-text-muted hover:text-accent hover:bg-accent/10 border-border'
              }`}
              title={isVoicePrompting ? 'Stop recording & send prompt' : 'Speak prompt to AI Assistant'}
            >
              {isTranscribingPrompt ? (
                <RefreshCw size={18} className="animate-spin text-accent" />
              ) : isVoicePrompting ? (
                <MicOff size={18} />
              ) : (
                <Mic size={18} />
              )}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
              placeholder={
                isVoicePrompting
                  ? 'Listening to your question... speak now'
                  : isTranscribingPrompt
                  ? 'Transcribing your voice prompt...'
                  : 'Ask about your spending, budget envelopes, or financial goals...'
              }
              disabled={isTranscribingPrompt}
              className="flex-1 bg-primary border border-border hover:border-border/80 focus:border-accent text-text placeholder-text-muted text-sm rounded-xl px-4 py-3 focus:outline-none transition-colors"
            />

            <button
              type="button"
              onClick={() => {
                if (isVoicePrompting) handleStopPromptVoice();
                else handleSendQuery();
              }}
              disabled={(!inputQuery.trim() && !isVoicePrompting) || isProcessing || isTranscribingPrompt}
              className="bg-accent hover:bg-accent-hover text-primary p-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md cursor-pointer"
              title="Send prompt to AI"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
