import { UndoToast } from './components/undo-toast.tsx';
import { useRoute } from './hooks/use-route.ts';
import { AnswerScreen } from './screens/answer.tsx';
import { BoardScreen } from './screens/board.tsx';
import { HelpScreen } from './screens/help.tsx';
import { HomeScreen } from './screens/home.tsx';
import { PlayersScreen } from './screens/players.tsx';
import { PointsScreen } from './screens/points.tsx';
import { PrintScreen } from './screens/print.tsx';
import { QuestionScreen } from './screens/question.tsx';
import { WizardScreen } from './screens/wizard.tsx';
import { useApp } from './state/app-state.tsx';

export default function App() {
  const route = useRoute();
  const { warning } = useApp();

  return (
    <div className="shell">
      {warning ? <p className="banner no-print" role="status">{warning}</p> : null}
      {route.name === 'home' ? <HomeScreen /> : null}
      {route.name === 'new' ? <WizardScreen mode={route.mode} /> : null}
      {route.name === 'board' ? <BoardScreen moduleId={route.moduleId} /> : null}
      {route.name === 'question' ? <QuestionScreen moduleId={route.moduleId} clueId={route.clueId} /> : null}
      {route.name === 'answer' ? <AnswerScreen moduleId={route.moduleId} clueId={route.clueId} /> : null}
      {route.name === 'points' ? <PointsScreen moduleId={route.moduleId} clueId={route.clueId} /> : null}
      {route.name === 'players' ? <PlayersScreen moduleId={route.moduleId} /> : null}
      {route.name === 'print' ? <PrintScreen moduleId={route.moduleId} /> : null}
      {route.name === 'help' ? <HelpScreen moduleId={route.moduleId} /> : null}
      <UndoToast />
    </div>
  );
}
