# Manual accessibility pass

Automated checks (axe) catch roughly a third of real problems. Do this pass before each release.

## Keyboard only (unplug the mouse)
- [ ] Tab reaches every control, in a sensible order, with a visible focus ring.
- [ ] Import: the drop zone opens with Enter or Space. "Try the sample data" works.
- [ ] Explore: chart type buttons, the "Table" toggle, "Include in report" and "Show chart" all work.
- [ ] Compose: click-to-edit text opens with Enter, saves when focus leaves, Esc cancels.
- [ ] Compose: reorder with the keyboard (focus a ⠿ handle, Space, arrow keys, Space). The ↑ ↓ buttons also work.
- [ ] Export: radio cards, the download button and the page strip can be reached and used.
- [ ] Ctrl+Z and Ctrl+Shift+Z undo and redo in Compose (not while typing in a field).

## Screen reader (NVDA on Windows is free; VoiceOver on Mac)
- [ ] The stage list announces the current step ("current step").
- [ ] Each chart announces its title and point count, and the Table toggle reveals every value.
- [ ] Drag-and-drop announces pick-up, move and drop.
- [ ] Load errors and export results are announced (alerts and status messages).
- [ ] Preview pages are announced as "Page 1 of N" or "Slide 1 of N".

## Display
- [ ] Browser zoom 200%: nothing is cut off, no two-way scrolling except tables and the data grid.
- [ ] Windows High Contrast or forced colours: all controls remain visible.
- [ ] System setting "reduce motion": no animation.
- [ ] Colour is never the only signal (warnings say "Check", problems say "Problem").

## Known gaps
- Exported PDFs are not tagged for screen readers. They have real, selectable text, but no heading structure.