import { Undo2Icon, Redo2Icon } from "lucide-react";
import "./HistoryControls.css";
import { useHistory } from "../../store/flowStore";

export default function HistoryControls() {
  const { undo, redo, canRedo, canUndo } = useHistory();

  const onUndo = () => {
    // console.log(pastStates.length)
    // console.log(futureStates.length)

    /* Temporary solution: 
                There is this issue where during user interactions 
            like drags and inputs, a single action creates two history entries.
            Therefore on first undo, nothing happens. The real undo happens 
            on the second click.

            To get around that we would temporarily run `undo()` twice 
            making it work as intended (a single click undos the action).
            This only applies to drag actions like resize and move as 
            there are still unhandled continuous inputs such as textareas 
            and inputs tracking every single character input.
        */

    undo();
    undo();
  };
  const onRedo = () => {
    /* TODO: Make Redo work
            issue:  
            There is no history that is put into the `futureStates` array
            even after an undo action. 
        */

    redo();
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
