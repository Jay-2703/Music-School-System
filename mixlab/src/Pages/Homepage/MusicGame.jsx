import React, { useEffect, useState, useRef } from 'react';
import { Howl } from 'howler';
import { useNavigate } from 'react-router-dom'; 
import { 
  ArrowLeft, MoreVertical, BookOpen, Star, Trophy, Lock, 
  PlayCircle, RotateCcw, AlertCircle, CheckSquare, Home, User
} from 'lucide-react'; 
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { auth } from '../../firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './MusicGame.css';

// --- LESSON DATA ---
const LESSONS = [
  { id: 1, title: "The Basics", desc: "Identify C, D, and E notes.", targetScore: 50, notes: ['C', 'D', 'E'], badgeIcon: <Star size={40} color="#FFD700" />, badgeName: "Rookie Star" },
  { id: 2, title: "Full Octave", desc: "Master all white keys.", targetScore: 80, notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], badgeIcon: <BookOpen size={40} color="#2196f3" />, badgeName: "Scholar" },
  { id: 3, title: "Sharps & Flats", desc: "Introduction to Black keys.", targetScore: 100, notes: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'], badgeIcon: <Trophy size={40} color="orange" />, badgeName: "Maestro" }
];

// --- AUDIO SETUP ---
const PIANO_SOUNDS = {
  'C': new Howl({ src: ['/sounds/C.wav'] }), 'Db': new Howl({ src: ['/sounds/Cs.wav'] }), 'D': new Howl({ src: ['/sounds/D.wav'] }), 'Eb': new Howl({ src: ['/sounds/Ds.wav'] }),
  'E': new Howl({ src: ['/sounds/E.wav'] }), 'F': new Howl({ src: ['/sounds/F.wav'] }), 'Gb': new Howl({ src: ['/sounds/Fs.wav'] }), 'G': new Howl({ src: ['/sounds/G.wav'] }),
  'Ab': new Howl({ src: ['/sounds/Gs.wav'] }), 'A': new Howl({ src: ['/sounds/A.wav'] }), 'Bb': new Howl({ src: ['/sounds/As.wav'] }), 'B': new Howl({ src: ['/sounds/B.wav'] }),
};
const playSound = (note) => { if (PIANO_SOUNDS[note]) { PIANO_SOUNDS[note].stop(); PIANO_SOUNDS[note].play(); } };

const ALL_NOTES = [
  { name: 'C', vfKey: 'c/4' }, { name: 'D', vfKey: 'd/4' }, { name: 'E', vfKey: 'e/4' },
  { name: 'F', vfKey: 'f/4' }, { name: 'G', vfKey: 'g/4' }, { name: 'A', vfKey: 'a/4' },
  { name: 'B', vfKey: 'b/4' }, { name: 'Db', vfKey: 'db/4', accidental: 'b' },
  { name: 'Eb', vfKey: 'eb/4', accidental: 'b' }, { name: 'Gb', vfKey: 'gb/4', accidental: 'b' },
  { name: 'Ab', vfKey: 'ab/4', accidental: 'b' }, { name: 'Bb', vfKey: 'bb/4', accidental: 'b' },
];

// --- SHARED COMPONENTS ---
const Header = ({ title, onBack }) => (
  <div className="game-header">
    {onBack ? <button onClick={onBack} className="icon-btn"><ArrowLeft size={24} /></button> : <div style={{width: 24}}></div>}
    <span className="header-title">{title}</span>
    <button className="icon-btn"><MoreVertical size={24} /></button>
  </div>
);

const SheetMusic = ({ noteData, clef = "treble", width = 250, height = 150 }) => {
  const containerRef = useRef(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont("Arial", 10, "").setBackgroundFillStyle("#fef3c7");
    const stave = new Stave(10, 20, width - 20);
    stave.addClef(clef);
    stave.setContext(context).draw();
    if (noteData) {
      const notesToDraw = Array.isArray(noteData) ? noteData : [noteData];
      const staveNotes = notesToDraw.map(n => {
        const note = new StaveNote({ keys: [n.vfKey], duration: "q", clef: clef });
        if (n.accidental) note.addModifier(new Accidental(n.accidental));
        return note;
      });
      const voice = new Voice({ num_beats: notesToDraw.length, beat_value: 4 });
      voice.setStrict(false);
      voice.addTickables(staveNotes);
      new Formatter().joinVoices([voice]).format([voice], width - 50);
      voice.draw(context, stave);
    }
  }, [noteData, clef]);
  return <div ref={containerRef} className="sheet-paper" />;
};

// --- SCREENS ---
const HomeScreen = ({ nav, onQuit, username }) => (
  <div className="home-screen" style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      <button onClick={onQuit} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>
        <Home size={20} /> Home
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#303F9F', fontWeight: 'bold', fontSize: '14px' }}>
         <User size={18} /> {username}
      </div>
    </div>
    <button onClick={() => nav('lessons')} className="btn-lessons"><BookOpen size={24} /> Music Lessons</button>
    <div className="start-btn-wrapper">
      <div className="start-btn-glow"></div>
      <button onClick={() => nav('game', { mode: 'timed' })} className="btn-start">START</button>
    </div>
    <div className="bottom-btns">
       <button onClick={() => nav('stats')} className="btn-blue-circle">Statistics</button>
       <button onClick={() => nav('options')} className="btn-blue-circle">Options</button>
    </div>
  </div>
);

const LessonsScreen = ({ nav, progress }) => (
  <div className="game-play-area" style={{backgroundColor: '#f8fafc'}}>
    <Header title="Lessons" onBack={() => nav('home')} />
    <div className="lessons-container">
      {LESSONS.map((lesson) => {
        const isUnlocked = lesson.id === 1 || progress[lesson.id - 1]; 
        const isCompleted = progress[lesson.id];
        return (
          <div key={lesson.id} className={`lesson-card ${isCompleted ? 'completed' : ''}`}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
               <div><h3 style={{fontSize: '1.125rem', fontWeight: 'bold', margin: '0 0 4px 0'}}>{lesson.title}</h3><p style={{fontSize: '0.875rem', color: '#64748b', margin: 0}}>{lesson.desc}</p></div>
               {isCompleted && <div>{lesson.badgeIcon}</div>}
            </div>
            <button disabled={!isUnlocked} onClick={() => nav('game', { mode: 'lesson', lessonId: lesson.id })} className={`lesson-btn ${isUnlocked ? 'unlocked' : 'locked'}`}>
              {isUnlocked ? <><PlayCircle size={18}/> Start</> : <><Lock size={18}/> Locked</>}
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

const GameScreen = ({ nav, params, onCompleteLesson, onQuit }) => {
  const currentLesson = params.mode === 'lesson' ? LESSONS.find(l => l.id === params.lessonId) : null;
  const gameNotes = currentLesson ? ALL_NOTES.filter(n => currentLesson.notes.includes(n.name)) : ALL_NOTES;

  const [gameState, setGameState] = useState('playing'); 
  const [targetNote, setTargetNote] = useState(gameNotes[0]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); 
  const [mistakes, setMistakes] = useState([]); 
  const [reviewIndex, setReviewIndex] = useState(0); 
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (params.mode === 'timed') {
      if (timeLeft <= 0) { setGameState('summary'); return; }
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, gameState, params.mode]);

  const handleGuess = (noteName) => {
    playSound(noteName);
    if (noteName === targetNote.name) {
      const newScore = score + 10;
      setScore(newScore);
      if (currentLesson && newScore >= currentLesson.targetScore) { setShowWinModal(true); onCompleteLesson(currentLesson.id); } 
      else { setTargetNote(gameNotes[Math.floor(Math.random() * gameNotes.length)]); }
    } else { setMistakes(prev => [...prev, { note: targetNote, userAnswer: noteName }]); }
  };

  const restartGame = () => {
    setScore(0); setMistakes([]); setTimeLeft(60); setGameState('playing');
    setTargetNote(gameNotes[Math.floor(Math.random() * gameNotes.length)]);
  };

  const KeyBtn = ({ label, type, onClick }) => {
    if (type === 'black') return <button onClick={onClick} className="key-black">{label}</button>;
    return <button onClick={onClick} className="key-white">{label}</button>;
  };

  if (gameState === 'summary') {
    return (
      <div className="game-play-area">
        <Header title="Summary" onBack={() => nav('home')} />
        <div className="home-screen">
          <div style={{textAlign: 'center', width: '100%'}}><h2 style={{fontSize: '2rem', fontWeight: 'bold', color: '#1e293b'}}>Score: {score}</h2><div style={{margin: '20px auto', width: '80%', height: '2px', backgroundColor: '#e2e8f0'}}></div></div>
          <div className="bottom-btns">
            <button onClick={restartGame} className="btn-blue-circle" style={{fontSize: '1rem', flexDirection: 'column'}}><RotateCcw size={24}/> Play Again</button>
            <button onClick={() => { if (mistakes.length > 0) { setReviewIndex(0); setGameState('review'); } else { alert("Perfect Score!"); } }} className="btn-blue-circle" style={{fontSize: '1rem', flexDirection: 'column', opacity: mistakes.length === 0 ? 0.5 : 1}}><AlertCircle size={24}/> Review</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'review') {
    const mistake = mistakes[reviewIndex];
    return (
      <div className="game-play-area">
        <Header title="Review Mistakes" onBack={() => setGameState('summary')} />
        <div className="home-screen">
           <div className="sheet-container" style={{flex: 0, padding: '20px'}}><SheetMusic noteData={mistake.note} /></div>
           <div style={{textAlign: 'center', marginBottom: '20px'}}>
             <h3 style={{color: '#64748b'}}>Correct: <span style={{color: 'black', fontWeight: 'bold'}}>{mistake.note.name}</span></h3>
             <h3 style={{color: '#64748b'}}>You Pressed: <span style={{color: '#ef4444', fontWeight: 'bold'}}>{mistake.userAnswer}</span></h3>
           </div>
           <button onClick={() => { if (reviewIndex < mistakes.length - 1) setReviewIndex(i => i + 1); else setGameState('summary'); }} className="btn-lessons" style={{backgroundColor: '#2196F3'}}>Next Mistake</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-play-area">
      <Header title={currentLesson ? `Challenge: ${currentLesson.title}` : "Identify Notes"} onBack={() => setShowQuitModal(true)} />
      <div className="stats-bar">
        <div className="stat-item">
          <p className="stat-label">TIME</p>
          {/* CHANGE 'red' TO 'stat-red' */}
          <p className={`stat-value ${timeLeft < 10 ? 'stat-red' : ''}`}> 
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </p>
        </div>
        <div className="stat-item">
          <p className="stat-label">SCORE</p>
          {/* CHANGE 'blue' TO 'stat-blue' */}
          <p className="stat-value stat-blue">{score}</p>
        </div>
      </div>
      
      <div className="sheet-container"><SheetMusic noteData={targetNote} /></div>
      <div className="piano-container">
         <div className="black-keys-row"> 
            {['Db','Eb'].map(n => <KeyBtn key={n} label={n} type="black" onClick={() => handleGuess(n)} />)}
            <div className="spacer-key"></div> 
            {['Gb','Ab','Bb'].map(n => <KeyBtn key={n} label={n} type="black" onClick={() => handleGuess(n)} />)}
         </div>
         <div className="white-keys-row">
           {['C','D','E','F','G','A','B'].map(n => <KeyBtn key={n} label={n} type="white" onClick={() => handleGuess(n)} />)}
         </div>
      </div>
      {showWinModal && currentLesson && (
        <div className="modal-overlay">
           <div className="modal-content">
             <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px'}}>Challenge Complete!</h2>
             <div style={{margin: '20px auto'}}>{currentLesson.badgeIcon}</div>
             <p style={{fontWeight: 'bold', color: '#ca8a04', marginBottom: '20px'}}>{currentLesson.badgeName}</p>
             <button onClick={() => nav('lessons')} className="btn-lessons" style={{backgroundColor: '#2196F3'}}>Continue</button>
           </div>
        </div>
      )}
      {showQuitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px'}}>Quit Session?</h2>
            <div style={{display: 'flex', justifyContent: 'center', gap: '16px'}}>
              <button onClick={() => setShowQuitModal(false)} className="btn-cancel">CANCEL</button>
              <button onClick={() => nav('home')} className="btn-quit">QUIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OptionsScreen = ({ nav, onQuit }) => (
  <div className="game-play-area">
    <Header title="Options" onBack={() => nav('home')} />
    <div style={{padding: '24px'}}>
      <h3 style={{fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '16px'}}>Settings</h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}><CheckSquare color="#2196F3" /> <span>Treble Clef</span></div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}><CheckSquare color="#2196F3" /> <span>Bass Clef</span></div>
      </div>
    </div>
  </div>
);

const StatsScreen = ({ nav, onQuit }) => (
  <div className="game-play-area">
    <Header title="Statistics" onBack={() => nav('home')} />
    <div style={{padding: '24px', textAlign: 'center'}}>
      <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '24px'}}>Player Progress</h2>
      <div style={{backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between'}}>
        <span style={{color: '#64748b', fontWeight: 'bold'}}>Lessons Completed</span>
        <span style={{fontWeight: 'bold', fontSize: '1.25rem'}}>1</span>
      </div>
    </div>
  </div>
);

// --- MAIN GAME COMPONENT ---
export default function MusicGame() {
  const routerNavigate = useNavigate(); 
  const [screen, setScreen] = useState('home'); 
  const [params, setParams] = useState({}); 
  const [completedLessons, setCompletedLessons] = useState({}); 
  
  // --- FIREBASE LOGIN CHECK ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in
        setCurrentUser(user);
        setLoading(false);
      } else {
        // User is NOT logged in -> Kick them back to Home
        routerNavigate('/');
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle Logout (Quit to Website)
  const handleQuit = () => {
    // Optional: If you want 'Quit' to also Log Out, verify with:
    // signOut(auth);
    routerNavigate('/');
  };

  const navigate = (screenName, parameters = {}) => {
    setScreen(screenName);
    setParams(parameters);
  };
  const handleLessonComplete = (id) => setCompletedLessons(prev => ({ ...prev, [id]: true }));

  // Hide nav/footer
  useEffect(() => {
    const nav = document.querySelector('nav') || document.querySelector('.Nav1');
    const footer = document.querySelector('footer') || document.querySelector('.footer');
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  // While checking login status, show nothing (or a loader)
  if (loading) return null;


return (
    <div className="game-overlay">
      <div className="game-container">
        {screen === 'home' && <HomeScreen nav={navigate} onQuit={handleQuit} username={currentUser?.displayName || currentUser?.email || 'Player'} />}
        {screen === 'lessons' && <LessonsScreen nav={navigate} progress={completedLessons} />}
        {screen === 'game' && <GameScreen nav={navigate} params={params} onCompleteLesson={handleLessonComplete} onQuit={handleQuit} />}
        {screen === 'options' && <OptionsScreen nav={navigate} onQuit={handleQuit} />}
        {screen === 'stats' && <StatsScreen nav={navigate} onQuit={handleQuit} />}
      </div>
    </div>
  );
}