import { Undo2Icon, Redo2Icon } from "lucide-react";
import "./HistoryControls.css";
// import { useEffect } from "react";
import { useHistory } from "../../store/flowStore";

export default function HistoryControls() {
  const { undo, redo, canRedo, canUndo } = useHistory();

  /* 
  // for debugging purposes
  // const { pastStates, futureStates } = useHistory();
  useEffect(() => {
    console.log(`Past states: ${pastStates.length}`);
    console.log(`Future states: ${futureStates.length}`);
  },[pastStates, futureStates])
  */

  const onUndo = () => {
    undo();
    // console.log(`Future states: ${futureStates.length}`);
    // console.log(`Past states: ${pastStates.length}`)
  };
  const onRedo = () => {
    redo();
    // console.log(`Future states: ${futureStates.length}`);
    // console.log(`Past states: ${pastStates.length}`)
  };

  return (
    <div className="history-controls">
      <button
        className={"history-controls__button " + `${canUndo ? "" : "disabled"}`}
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo2Icon />
      </button>
      <button
        className={"history-controls__button " + `${canRedo ? "" : "disabled"}`}
        onClick={onRedo}
        disabled={!canRedo}
      >
        <Redo2Icon />
      </button>
    </div>
  );
}
