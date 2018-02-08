// Ignore if already in borg
if (!window.pageborg) {
  // Otherwise, redirect to ./#topic=this-topic.html
  window.location = "./#topic=" + location.href.split("/").slice(-1)
}