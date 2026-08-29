import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { socket as sharedSocket } from '@/socket';
import { CenteredCard } from '@/components/CenteredCard';
import '@/styles/ParticipantSessionPage.css';
import { joinSessionByCode, Session, SessionError } from '@/api/sessionApi';

type PageState = 'loading' | 'not-found' | 'error' | 'ready';

const REACTION_LABELS: Record<string, string> = {
  '👍': 'Réagissez en attendant !',
  '❤️': 'Réagissez en attendant !',
  '🎉': 'Réagissez en attendant !',
  '🔥': 'Réagissez en attendant !',
  '👏': 'Réagissez en attendant !',
};

/**
 * Standalone participant page, reachable two ways:
 *  - via JoinPage after manual code entry (navigate)
 *  - directly by scanning the presenter's QR code (cold load)
 *
 * Flow:
 *  1. Fetch session by code
 *  2. Join with deviceId to get participant token
 *  3. Store token in localStorage
 *  4. Connect WebSocket with token
 */

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('reagis_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('reagis_device_id', deviceId);
  }
  return deviceId;
}

const ParticipantSessionPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isBouncing, setIsBouncing] = useState(false); // petit feedback visuel optionnel

  // 1. Fetch the session, then join to get the participant token
  useEffect(() => {
    if (!code) {
      setState('not-found');
      return;
    }

    let cancelled = false;
    setState('loading');
    const deviceId = getOrCreateDeviceId();
    joinSessionByCode(code, deviceId)
      .then((result: { token: string; session: Session }) => {
        if (cancelled) return;
        // result should contain { token, session }
        setSession(result.session);
        setParticipantToken(result.token);
        localStorage.setItem('reagis_participant_token', result.token);
        setState('ready');
      })
      .catch((err: SessionError) => {
        if (cancelled) return;
        setState(err.code === 'not-found' ? 'not-found' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  // Open the WebSocket only once the session is confirmed and token is obtained
  useEffect(() => {
    if (state !== 'ready' || !code || !participantToken) return;

    sharedSocket.io.opts.query = {
      sessionCode: code,
      token: participantToken,
    };
    sharedSocket.connect();
    socketRef.current = sharedSocket;

    sharedSocket.on('session:started', () => {
      navigate(`/vote/${code}`);
    });

    sharedSocket.on('session:updated', (updated: Partial<Session>) => {
      setSession((prev) => (prev ? { ...prev, ...updated } : prev));
    });

    sharedSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return () => {
      sharedSocket.off('session:started');
      sharedSocket.off('session:updated');
      sharedSocket.off('connect_error');
      sharedSocket.disconnect();
      socketRef.current = null;
    };
  }, [state, code, participantToken, navigate]);

  if (state === 'loading') {
    return (
      <CenteredCard className="participant-session-page">
        <p className="participant-session-page__status">
          Chargement de la session…
        </p>
      </CenteredCard>
    );
  }
  const handleReactionClick = () => {
    if (!socketRef.current || !session) return;

    // Mise à jour optimiste locale
    setSession((prev) =>
      prev ? { ...prev, reactionCount: (prev.reactionCount ?? 0) + 1 } : prev
    );

    // Feedback visuel (optionnel)
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 150);

    // Notifie le serveur
    socketRef.current.emit('reaction:increment', { sessionCode: code });
  };

  if (state === 'not-found') {
    return (
      <CenteredCard className="participant-session-page">
        <h1 className="participant-session-page__title">Session introuvable</h1>
        <p className="participant-session-page__subtitle">
          Le code « {code} » ne correspond à aucune session active.
        </p>
        <button
          className="participant-session-page__cta"
          onClick={() => navigate('/join')}
        >
          Rejoindre une autre session
        </button>
      </CenteredCard>
    );
  }

  if (state === 'error') {
    return (
      <CenteredCard className="participant-session-page">
        <h1 className="participant-session-page__title">
          Une erreur est survenue
        </h1>
        <p className="participant-session-page__subtitle">
          Impossible de charger la session pour le moment.
        </p>
        <button
          className="participant-session-page__cta"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard className="participant-session-page">
      <p className="participant-session-page__eyebrow">
        SESSION · {session!.code}
      </p>
      {session!.name && (
        <p className="participant-session-page__name">{session!.name}</p>
      )}
      <button
        type="button"
        className={`participant-session-page__reaction${
          isBouncing ? ' participant-session-page__reaction--bounce' : ''
        }`}
        onClick={handleReactionClick}
        aria-label="Envoyer une réaction"
      >
        {session!.reaction || '👍'}
      </button>

      <p className="participant-session-page__prompt">
        {REACTION_LABELS[session!.reaction] ?? 'Réagissez en attendant !'}
      </p>

      <div className="participant-session-page__waiting">
        <span
          className="participant-session-page__spinner"
          aria-hidden="true"
        />
        En attente du présentateur…
      </div>
    </CenteredCard>
  );
};

export default ParticipantSessionPage;
