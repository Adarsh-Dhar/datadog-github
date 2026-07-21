const test = require("node:test");
const assert = require("node:assert/strict");
const { appendReviewNote } = require("../src/datahub/writeback");

test("adds a PR Guardian review beneath an existing description", () => {
  const note = "[PR Guardian] Reviewed in PR #42. Severity: high.";
  assert.equal(
    appendReviewNote("Revenue mart used by finance.", note),
    "Revenue mart used by finance.\n\n" + note,
  );
});

test("does not duplicate an existing PR Guardian review", () => {
  const note = "[PR Guardian] Reviewed in PR #42. Severity: high.";
  assert.equal(appendReviewNote(note, note), note);
});
