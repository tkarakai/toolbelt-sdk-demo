// Protocol 3 declarations: every action id SDK Explorer's trees and toasts use, and every form, with
// what it does. ToolBelt refuses a render that uses anything undeclared, journals `write`, `external`
// and `destructive` events (and fields of `write` forms), and asks the person before an agent runs
// anything but `view`. Every effect here is harmless: data is in memory or the demo's counter file.
import type {ActionDeclaration,FormDeclaration} from '@toolbelt/sdk';

export const ACTIONS={
 // Shared toolbar, quick view and the fixture dialog.
 increment:{effect:'write',describe:'Adds one to the demo counter and the sidebar badge'},
 'open-dialog':{effect:'view'},
 copy:{effect:'view',describe:'Copies a fixed fixture text'},
 toast:{effect:'view',describe:'Shows a toast with an Undo button'},
 undo:{effect:'write',describe:'Puts the counter back to what it was when the toast was shown'},
 'save-dialog':{effect:'view',describe:'Closes the fixture dialog; nothing is saved'},
 // Tables.
 inspect:{effect:'view',describe:'Shows a toast naming the row'},
 'choose-target':{effect:'view',describe:'Shows a toast naming the chosen target'},
 destructive:{effect:'destructive',describe:'Pretends to reset the fixture; nothing changes'},
 disabled:{effect:'view'},
 bulk:{effect:'view',describe:'Shows a toast naming the checked rows'},
 'queue-up':{effect:'write'},
 'queue-down':{effect:'write'},
 'queue-unread':{effect:'write'},
 // Views.
 'add-label':{effect:'write',describe:'Adds the next label kind as a filter (saved with the counter)'},
 'remove-label':{effect:'write',describe:'Removes the last label filter'},
 'lock-view':{effect:'write',describe:'Locks or unlocks the Views tab: while locked, every view change there is refused'},
 // Output.
 append:{effect:'write'},
 'add-note':{effect:'write'},
 'edit-note':{effect:'write'},
 'delete-note':{effect:'destructive'},
 // Lifecycle.
 'handoff-count':{effect:'write',describe:'Counts an event; never focuses another app'},
 defer:{effect:'write',describe:'Makes upgrade preparation report not ready, or ready again'},
 'clear-badge':{effect:'write'},
 'string-badge':{effect:'write'},
 // Actions: one of every effect, a split button, a draft dialog, rows with a pane, results.
 'toggle-tip':{effect:'view',describe:'Shows or hides a tip in this instance only'},
 'add-item':{effect:'write',describe:'Adds a fixture item and returns its id'},
 'add-three':{effect:'write',describe:'Adds three fixture items and returns their ids'},
 'new-item':{effect:'view',describe:'Opens the New item dialog in this instance'},
 'save-item':{effect:'write',describe:'Adds the dialog’s item and returns its id'},
 'open-guide':{effect:'external',describe:'Says which page of the SDK guide it would open; opens nothing'},
 'clear-items':{effect:'destructive',describe:'Removes every fixture item (Undo in the toast restores them)'},
 'undo-clear':{effect:'write'},
 'restore-samples':{effect:'write',agent:false},
 'item-done':{effect:'write'},
 'item-reopen':{effect:'write'},
 'item-rename':{effect:'write',describe:'Renames the item to the text given'},
 'item-copy':{effect:'view',describe:'Copies the item’s title'},
 'item-copy-id':{effect:'view',describe:'Copies the item’s id'},
 'item-delete':{effect:'destructive'},
 'items-done':{effect:'write'},
 'go-views':{effect:'view',describe:'Shows the Views tab with an overdue task selected'},
 'fail-on-purpose':{effect:'view',describe:'Fails with an error; nothing changes'},
 decline:{effect:'view',describe:'Answers not handled; nothing changes'},
 // Floating window: agents act on screens only, so these are the person's (`agent: false` keeps
 // them out of agents' lists of each screen's actions).
 'floating-ask':{effect:'view',agent:false},
 'floating-new':{effect:'view',agent:false},
 'floating-page-form':{effect:'view',agent:false},
 'floating-page-list':{effect:'view',agent:false},
 'floating-busy':{effect:'view',agent:false},
 'floating-pick':{effect:'view',agent:false},
 'floating-recent-1':{effect:'view',agent:false},
 'floating-recent-2':{effect:'view',agent:false},
} satisfies Record<string,ActionDeclaration>;

export const FORMS={
 /** Forms: every field saves as it changes. */
 preferences:{effect:'write'},
 /** The Forms body's segmented control: plugin state, not a view control. */
 mode:{effect:'write'},
 /** The fixture dialog's note: a draft nothing saves. */
 'dialog-form':{effect:'view'},
 /** The New item dialog's draft, per instance until Save. */
 'item-draft':{effect:'view'},
 /** A fixture item's row pane: each field saves as it changes. */
 'item-pane':{effect:'write'},
 'floating-form':{effect:'write'},
} satisfies Record<string,FormDeclaration>;

export type ActionId=keyof typeof ACTIONS;
