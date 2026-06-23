import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Drawer, Fab, Typography, IconButton, TextField, Button,
  Paper, Stack, CircularProgress, Alert, Skeleton, Divider,
} from '@mui/material';
import { Close, Send, SmartToy, PersonOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { initAgentThread, sendAgentMessage, closeAgentThread } from '../../api/aiAgent';

const GUEST_MESSAGE =
  'Для использования ИИ-помощника и автоматического оформления заказов, пожалуйста, ' +
  'зарегистрируйтесь или войдите в свой аккаунт';

const ORDER_SUCCESS_TEXT =
  'Заказ успешно оформлен ИИ-ассистентом! Вы можете отслеживать его статус в личном кабинете.';

const THREAD_STORAGE_KEY = 'restaurant_ai_thread_id';

function MessageBubble({ message }) {
  const isUser      = message.role === 'user';
  const isSystem    = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  if (isSystem) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          bgcolor: 'success.light',
          color: 'success.contrastText',
          borderRadius: 2,
          border: 1,
          borderColor: 'success.main',
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          {message.text}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
      }}
    >
      {isAssistant && (
        <SmartToy
          fontSize="small"
          sx={{ color: 'primary.main', mb: 0.5, flexShrink: 0 }}
        />
      )}

      <Paper
        elevation={0}
        sx={{
          px: 1.5,
          py: 1,
          maxWidth: '82%',
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          borderTopRightRadius: isUser ? 4 : 16,
          borderTopLeftRadius: isUser ? 16 : 4,
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.text}
        </Typography>
      </Paper>

      {isUser && (
        <PersonOutlined
          fontSize="small"
          sx={{ color: 'text.secondary', mb: 0.5, flexShrink: 0 }}
        />
      )}
    </Stack>
  );
}

export default function AiAssistantDrawer() {
  const { user, role, isGuest, loading: authLoading } = useAuth();
  const notify   = useNotification();
  const navigate = useNavigate();

  const [open, setOpen]           = useState(false);
  const [threadId, setThreadId]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const scrollRef  = useRef(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!open || isGuest || authLoading || !user) return;

    let cancelled = false;

    const bootThread = async () => {
      const stored = sessionStorage.getItem(THREAD_STORAGE_KEY);
      if (stored) {
        setThreadId(stored);
        return;
      }

      setInitLoading(true);
      try {
        const { threadId: newId } = await initAgentThread();
        if (cancelled) return;
        sessionStorage.setItem(THREAD_STORAGE_KEY, newId);
        setThreadId(newId);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          text: 'Здравствуйте! Я ваш помощник по меню. Расскажите, что вам нравится — помогу выбрать блюда или оформлю заказ.',
        }]);
      } catch (err) {
        if (!cancelled) notify.error('Не удалось подключить ИИ-помощника: ' + err.message);
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    };

    bootThread();
    return () => { cancelled = true; };
  }, [open, isGuest, authLoading, user, notify]);

  const handleClose = async () => {
    setOpen(false);

    if (threadId) {
      try {
        await closeAgentThread(threadId);
      } catch {
      }
      sessionStorage.removeItem(THREAD_STORAGE_KEY);
      setThreadId(null);
      setMessages([]);
      setInput('');
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !threadId || !user) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { reply, orderCreated } = await sendAgentMessage(threadId, text, user.id);

      setMessages(prev => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: reply },
        ...(orderCreated
          ? [{ id: `s-${Date.now()}`, role: 'system', text: ORDER_SUCCESS_TEXT }]
          : []),
      ]);
    } catch (err) {
      notify.error('Ошибка ИИ-помощника: ' + err.message);
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: 'Извините, произошла ошибка. Попробуйте ещё раз.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isGuestUser = role === 'guest' || isGuest;

  return (
    <>
      <Fab
        color="secondary"
        aria-label="ИИ-помощник"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: theme => theme.zIndex.drawer - 1,
          boxShadow: 4,
        }}
      >
        <SmartToy />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 420 },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'secondary.main',
            color: 'secondary.contrastText',
          }}
        >
          <SmartToy sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1.05rem' }}>
            ИИ-консультант
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'inherit' }}>
            <Close />
          </IconButton>
        </Box>

        {isGuestUser ? (
          <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {GUEST_MESSAGE}
            </Alert>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" fullWidth onClick={() => { handleClose(); navigate('/register'); }}>
                Регистрация
              </Button>
              <Button variant="contained" fullWidth onClick={() => { handleClose(); navigate('/login'); }}>
                Войти
              </Button>
            </Stack>
          </Box>
        ) : (
          <>
            <Box
              ref={scrollRef}
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                px: 2,
                py: 2,
                bgcolor: 'background.default',
              }}
            >
              {initLoading && messages.length === 0 && (
                <Stack spacing={1.5}>
                  <Skeleton variant="rounded" height={48} width="75%" />
                  <Skeleton variant="rounded" height={64} width="85%" sx={{ alignSelf: 'flex-end' }} />
                  <Skeleton variant="rounded" height={48} width="70%" />
                </Stack>
              )}

              <Stack spacing={1.5}>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {loading && (
                  <Stack direction="row" spacing={1} sx={{ color: 'text.secondary', alignItems: 'center' }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">Ассистент печатает…</Typography>
                  </Stack>
                )}
              </Stack>

              <Box ref={bottomRef} />
            </Box>

            <Divider />

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
                <TextField
                  inputRef={inputRef}
                  size="small"
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Спросите о меню или попросите оформить заказ…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || initLoading || !threadId}
                />
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={loading || initLoading || !input.trim() || !threadId}
                  sx={{ minWidth: 48, height: 40, px: 1.5 }}
                  aria-label="Отправить"
                >
                  {loading
                    ? <CircularProgress size={20} color="inherit" />
                    : <Send fontSize="small" />
                  }
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
}
