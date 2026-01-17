import { Undo2Icon, Redo2Icon } from "lucide-react"
import "./HistoryControls.css"
import { useHistory } from "../../store/flowStore"

export default function HistoryControls() {
    const { undo, redo, canRedo, canUndo } = useHistory();

    const onUndo = () => undo();
    const onRedo = () => redo();
  return (
    <div className="history-controls">
        <button 
        className={"history-controls__button "+`${canUndo ? "" : "disabled"}`}
        onClick={onUndo}
        disabled={!canUndo}>
            <Undo2Icon/>
        </button>
        <button 
        className={"history-controls__button "+`${canRedo ? "" : "disabled"}`}
        onClick={onRedo}
        disabled={!canRedo}>
            <Redo2Icon/>
        </button>
    </div>
  )
}
