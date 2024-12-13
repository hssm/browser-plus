// String from python
let bp_terms_str = null;

// Parsed in javascript
let bp_terms = null;

// Regex to search/replace
let bp_re = null;

// Currently focused element. Avoid exit events while still in it.
let has_focus = null;

// Build a regex from the string given to us by python
function bpParseTerms() {
  bp_terms = JSON.parse(bp_terms_str);
  bp_re = new RegExp('('+bp_terms.join("|")+')', "gi");
}

// On note load, highlight all fields
function bpHighlightAll() {
    bpRemoveAllOverlays();
    if (bp_terms.length == 0) {
      return;
    }
    let fields = document.querySelectorAll('.field-container .rich-text-editable');
    fields.forEach((f) => {
      let container = f.shadowRoot;
      bpHighlightField(f, container);
    })
}

// Highlight a single field
function bpHighlightField(field, container) {
    if (bp_terms.length == 0) {
      return;
    }
    let orig = container.querySelector('anki-editable');
    if (orig == null) {
      console.log("Orig was null by whyyyyy");
      return
    }
    let overlay = orig.cloneNode(true);
    orig.style.display = 'none';
    overlay.style.background = '#f0f !important';
    overlay.innerHTML = overlay.innerHTML.replace(bp_re,
      "<span style='background-color: #fbfb82; color: black;'>$&</span>");
    overlay.setAttribute('clone', true);
    container.append(overlay);
    overlay.addEventListener('focus', bpOnFocus);
    overlay.addEventListener('mouseover', bpCloneMouseover);
    orig.addEventListener('mouseleave', bpOnMouseleave);
    orig.addEventListener('blur', bpOnBlur);
}

// When loading a note, remove overlay from all fields. Fields
// are reused so we can't rely on them being new and empty
function bpRemoveAllOverlays() {
    let fields = document.querySelectorAll('.field-container .rich-text-editable');
    fields.forEach((f) => {
        let container = f.shadowRoot;
        bpRemoveOverlay(container);
    });
}

// Remove overlay from a single field
function bpRemoveOverlay(container) {
    let clone = container.querySelector('anki-editable[clone]');
    if (clone) {
        let orig = clone.previousElementSibling;
        orig.style=display = 'block';
        clone.remove();
    }
}


// We still need to let the user click into a field and edit
// the original (not the overlay). These events let us hide
// the overlay when the user hovers over or focuses on a field
// and rebuild the overlay when they leave it.
//
// It does change the focus interactions compared to the original
// but it's a tradeoff that has to be made to gain this feature.
//
// Focus events and positioning in a contenteditable inside a shadow
// dom is 100% broken and cannot be used for any clever tricks to mask
// focus switching seamlessly. This is the clever trick.

function bpCloneMouseover(event) {
  let clone = event.currentTarget;
  let orig = clone.previousElementSibling;
  let container = orig.parentNode;
  bpRemoveOverlay(container);
}

function bpOnFocus(event) {
  let clone = event.currentTarget;
  let orig = clone.previousElementSibling;
  let container = orig.parentNode;
  bpRemoveOverlay(container);
  orig.focus();
  has_focus = orig;
}

function bpOnBlur(event) {
  let orig = event.currentTarget;
  let container = orig.parentNode;
  let clone = container.querySelector('anki-editable[clone]');
  if (clone) {
    return;
  }
  bpHighlightField(orig, container);
  has_focus = null;
}

function bpOnMouseleave(event) {
  let orig = event.currentTarget;
  if (has_focus == orig) {
    return;
  }
  let container = orig.parentNode;
  let clone = container.querySelector('anki-editable[clone]');
  if (clone) {
    return;
  }
  bpHighlightField(orig, container);
  has_focus = null;
}
