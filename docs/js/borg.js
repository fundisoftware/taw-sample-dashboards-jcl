"use strict";

var pageborg = {
  tocFilePath: "toc.html",
  oldBrowserRedirectURL: "redirect-old-browser.html"
}; /* The trailing semicolon is significant before the opening parenthesis on the next line */

(function(exports) {
    
  // Private variables

  var urlParms, currentTOCEntry
  
  currentTOCEntry = null
  
  // Private functions
  
  // Initialize on page load
  function initialize() {
    
    // Redirect old browsers that don't support the Fetch API
    if (!window.fetch) {
      window.location = pageborg.oldBrowserRedirectURL
    }
    
    // Initialize the TOC pane splitter
    initializeSplit()
    
    // Listen for click events
    document.getElementsByTagName("main")[0].addEventListener("click", hijackLinks)
    
    // Listen for changes to the URL hash
    window.addEventListener("hashchange", onHashChange)
    
    // Get parameters from the URL
    urlParms = getURLParms()

    // Fetch the table of contents and display a topic
    fetchTOC().then(function() {assimilateTopic(urlParms.topic)})
  }

  // Keep link behavior inside the borg
  function hijackLinks(event) {
    var clickedElement = event.target
    if (clickedElement.nodeName == "A") {
      // Get href attribute from link element
      var linkHref = clickedElement.getAttribute("href")
      // Is there a TOC entry with the same href?
      var tocEntry = document.body.querySelector("#toc li [href=\"" + linkHref + "\"]")
      if (tocEntry) {
        event.stopPropagation()
        event.preventDefault()
        assimilateTopic(linkHref)
      } else {
        // Follow the link out of the borg
      }
    }
  }
  
  // Inserts text of corresponding TOC entry into empty <a class="toc"/> link elements
  function insertTOCLinkText(doc) {
    var linkHref, tocEntry, linkInnerHTML, linkElement
    var tocLinkElements = doc.body.querySelectorAll("a.toc")
    if (tocLinkElements.length > 0) {
      // Iterate over <a class="toc"> link elements 
      for (var i = 0; i < tocLinkElements.length; ++i) {
        linkElement = tocLinkElements[i]
        // Get href from link element 
        linkHref = linkElement.getAttribute("href")
        // Is there a TOC entry with the same href?
        tocEntry = document.getElementById("toc").querySelector("li [href=\"" + linkHref + "\"]")
        if (tocEntry) {
          // If link is empty, insert TOC link text; otherwise, leave the link text as-is
          if (linkElement.innerHTML == "") {
            linkElement.innerHTML  = tocEntry.innerHTML
          }
        } else {
          // No matching TOC entry found; report error
          linkElement.innerHTML += "<span class=\"error\"><code>class=\"toc\"</code> specified on this link, but no matching TOC entry found with <code>href=\"" + linkHref + "\"</code></span>" 
        }
      }
    }
  }
  
  function initializeSplit() {
    Split(["#toc", "#content"], {
      sizes: [25, 75],
      minSize: 100
    });
  }
  
  // Sets current TOC entry from url
  function setCurrentTOCEntry(url) {
    var currentTOCEntryClassName = "current"
    if (currentTOCEntry) {
      currentTOCEntry.classList.remove(currentTOCEntryClassName)
    }
    // Select TOC list item that contains link element that refers to this url
    currentTOCEntry = document.body.querySelector("#toc [href=\"" + url + "\"]").parentNode
    currentTOCEntry.classList.add(currentTOCEntryClassName)
  }

  // Gets parameters from URL hash
  function getURLParms() {
    var urlParms = {}
    var plusSign  = /\+/g // Regex for finding plus sign
    var decode = function (s) {
      return decodeURIComponent(s.replace(plusSign, " ")) }
    var splitParm = function (parm) {
      var splitArray = parm.split("=")
      urlParms[splitArray[0]] = decode(splitArray[1])
    }
    var parms =  location.hash.substr(1)
    if (parms.length) {
      parms.split("&").forEach(splitParm)
    }
    return urlParms
  }  

  // Inserts or updates parameter in URL hash
  function setURLParm(key, value) {
    var regex = new RegExp("([#&])" + key + "=.*?(&|$)", "i")
    var hash = location.hash
    if (hash.match(regex)) {
      // Parameter already exists in hash: update it
      hash = hash.replace(regex, "$1" + key + "=" + value + "$2")
    } else {
      // Append parameter to hash
      hash += (hash.length === 0 ? "#" : AMP) + key + "=" + value
    }
    location.hash = hash
  }  
  
  // Implants body of donor HTML document into element specified by id
  function implantHTML(html, id, customizeBeforeImplant, customizeAfterImplant) {
      var parser = new DOMParser()
      var donor = parser.parseFromString(html, "text/html")
      var recipient = document.getElementById(id)
      
      // Optionally customize the donor document before implanting it
      if (customizeBeforeImplant) {
        customizeBeforeImplant(donor)
      }
      // Replace element in this document with body of donor
      recipient.innerHTML = donor.body.innerHTML
      
      if (customizeAfterImplant) {
        customizeAfterImplant(recipient)
      }
  }
  
  // Populates <div class="child-topics"> with list of links to child topics
  function insertChildTopicList(doc) {
    var childTOCEntries, listItemInnerHTML, listItemFirstChild
    var childTopicListItemsHTML = ""
    var childTopicList = doc.querySelector("div.child-topics")
    // If the topic contains such a <div> and the current TOC entry has sub-entries...
    if (childTopicList && currentTOCEntry.querySelector("ul")) {
      // Get child entries (list items) of current TOC entry
      childTOCEntries = currentTOCEntry.querySelector("ul").children
      for (var i = 0; i < childTOCEntries.length; i++) {
        listItemFirstChild = childTOCEntries[i].firstChild
        if (listItemFirstChild.nodeType == Node.ELEMENT_NODE) {
          // The first child node of this TOC list item is an element (such as <a>);
          // get its HTML
          listItemInnerHTML = listItemFirstChild.outerHTML
        } else {
          // The first child node of this TOC list item is text;
          // get its value 
          listItemInnerHTML = listItemFirstChild.nodeValue
        }
        // Select child topics
        childTopicListItemsHTML += "<li>" + listItemInnerHTML + "</li>" 
      }
      childTopicList.innerHTML = "<ul>" + childTopicListItemsHTML + "</ul>"
    }
  }
  
  // Edits the topic before implanting it in this document
  function customizeTopicBeforeImplanting(doc) {
    var i
    insertBreadcrumbTrail(doc)
    insertTOCLinkText(doc)
    insertChildTopicList(doc)
    
    // Iterate over <object> children of <code> elements and set inline event handler
    doc.querySelectorAll("code > object").forEach(
      function(objectSourceElement) {
        objectSourceElement.setAttribute("onload", "pageborg.replaceObjectWithContents(event)")
      }
    )
    
    // If Prism is loaded, use it to highlight syntax (code)
    if (window.Prism) {
      Prism.highlightAllUnder(doc)
    }
  }
  
  // Returns href attribute value of next topic (that contains a link) in TOC
  function getNextTOCHref(currentTOCEntry) {
    var childList, nextElementSibling, firstElementChild
    var inTOC = true
    var linkElement = null
    var element = currentTOCEntry
    while (inTOC && !linkElement) {
      // Traverse forward through TOC in this order: descendants, next sibling, parent
      childList = element.querySelector("UL")
      if (childList) {
        // Get first link in child list
        linkElement = childList.querySelector("A")
      }
      if (!linkElement) {
        nextElementSibling = element.nextElementSibling
        if (nextElementSibling) {
          // Does the next sibling contain a link descendant?
          linkElement = nextElementSibling.querySelector("A")
          if (!linkElement) {
            // Start next iteration at next sibling
            element = nextElementSibling
          }
        } else {
          // No next sibling; traverse to first antecedent TOC entry that has a next sibling
          do {
            element = element.parentElement.parentElement
          } while ((element.tagName == "LI") && !element.nextElementSibling)
          if (element.tagName == "LI") {
            // We're still in the TOC
            inTOC = true
            // Traverse to next sibling
            element = element.nextElementSibling
            // Test whether this TOC entry has a child element, and whether it is a link
            firstElementChild = element.firstElementChild
            if (firstElementChild && (firstElementChild.tagName == "A")) {
              linkElement = firstElementChild 
            }
          } else {
            // We've traversed out of the TOC
            inTOC = false
          }
        }
      }
    }
    if (linkElement) {
      return linkElement.getAttribute("href")
    } else {
      return null
    }
  }

  function getPreviousTOCHref(currentTOCEntry) {
    var firstElementChild, previousElementSibling, descendantLinkElements
    var inTOC = true
    var linkElement = null
    var element = currentTOCEntry
    while (inTOC && !linkElement) {
      // Traverse backward through TOC in this order: descendants of previous sibling, parent
      previousElementSibling = element.previousElementSibling
      if (previousElementSibling) {
        // Does the previous sibling contain a link descendant?
        descendantLinkElements = previousElementSibling.querySelectorAll("A")
        if (descendantLinkElements.length == 0) {
          // Start next iteration at previous sibling
          element = previousElementSibling
        } else {
          // Select the last (in DOM order) link element
          linkElement = descendantLinkElements[descendantLinkElements.length - 1]
        }
      } else {
        // No previous sibling; traverse to parent
        element = element.parentElement.parentElement
        if (element.tagName == "LI") {
          // We're still in the TOC
          inTOC = true
          // Test whether this TOC entry has a child element, and whether it is a link
          firstElementChild = element.firstElementChild
          if (firstElementChild && (firstElementChild.tagName == "A")) {
            linkElement = firstElementChild 
          }
        } else {
          // We've traversed out of the TOC
          inTOC = false
        }
      }
    }
    if (linkElement) {
      return linkElement.getAttribute("href")
    } else {
      return null
    }
  }
  
  // Inserts a breadcrumb trail at the start of the topic
  function insertBreadcrumbTrail(doc) {
    var parent, listItemFirstChild, breadcrumb
    var breadcrumbTrail = ""
    var breadcrumbTrailElement = doc.createElement("p")
    breadcrumbTrailElement.classList.add("breadcrumbs")
    var antecedent = currentTOCEntry.parentElement
    
    // Step through the antecedents of the current TOC entry until we hit the TOC container
    // (a <div> element)
    while (antecedent.tagName !== "DIV") {
      if (antecedent.tagName == "LI") {
        listItemFirstChild = antecedent.firstChild
        if (listItemFirstChild.nodeType == Node.ELEMENT_NODE) {
          // The first child node of this TOC list item is an element (such as <a>);
          // get its HTML
          breadcrumb = listItemFirstChild.outerHTML /* textContent */
        } else {
          // The first child node of this TOC list item is text;
          // get its value
          breadcrumb = listItemFirstChild.nodeValue
        }
        // Add this step to the breadcrumb trail
        breadcrumbTrail = breadcrumb + " <span class=\"breadcrumb-separator\">&#x25B6;</span> " + breadcrumbTrail
      }
      antecedent = antecedent.parentElement
    }
    
    breadcrumbTrailElement.innerHTML = breadcrumbTrail
    
    // Insert breadcrumb trail before first child of topic
    
    doc.body.insertBefore(breadcrumbTrailElement, doc.body.firstChild)
    
    return breadcrumbTrailElement
  }
  
  function fetchFailed(error) {
    alert("Fetch failed: ", error.message)
  }
  
  // Fetch topic file, implant its body into this document, return promise 
  function assimilateTopic(topicUrl) {
    if (!topicUrl) {
      // If no topicUrl supplied, assimilate first topic in TOC
      topicUrl = document.getElementById("toc").querySelector("li [href]").getAttribute("href")
    }
    return fetch(topicUrl)
      .then(getResponseText)
      .catch(fetchFailed)
      .then(function(html) {implantTopic(topicUrl, html)})
      .then(setURLParm("topic", topicUrl))
  }
  
  // Get text of fetched response
  function getResponseText(response) {
    if (response instanceof Response) {
     return response.text()
    } else {
      alert("Not a response.")
    }
  }
  
  // Implant TOC document into this document
  function implantTOC(html) {
    implantHTML(html, "toc")
  }

  // Implant topic document into this document
  function implantTopic(url, html) {
    var recipientElementID = "body"
    setCurrentTOCEntry(url)
    implantHTML(html, recipientElementID, customizeTopicBeforeImplanting)
    // Scroll to top of container element
    document.getElementById(recipientElementID).parentElement.scrollTop = 0
  }

  // Fetch TOC file, implant in this document, return a promise
  function fetchTOC() {
    return fetch(exports.tocFilePath)
      .then(getResponseText)
      .catch(fetchFailed)
      .then(implantTOC)
  }
  
  // Event listener for URL hash change.
  // Perhaps the user has clicked the Browser back button):
  // go (back) to another page?
  function onHashChange() {
    var urlParms = getURLParms()
    assimilateTopic(urlParms.topic)
  }
  
  // Public methods
  
  // Replaces <object> children of <code> elements with the object contents
  exports.replaceObjectWithContents = function replaceObjectWithContents(event) {
    var objectElement = event.target
    var codeElement = objectElement.parentNode 
    // Get text content of <object> element
    // var code = objectElement.contentDocument.body.firstElementChild.textContent.trim()
    var objectText = objectElement.contentDocument.body.textContent.trim()
    // Insert text into DOM
    var textNode = document.createTextNode(objectText)
    codeElement.insertBefore(textNode, objectElement)
    // Remove <object> element
    codeElement.removeChild(objectElement)
    // Syntax-highlight the <code> element
    if (window.Prism) {
      Prism.highlightElement(codeElement, true)
    }
  }
  
  // Navigates to next topic in TOC
  exports.nextTopic = function nextTopic() {
    var topicHref = getNextTOCHref(currentTOCEntry)
    if (topicHref) {
      assimilateTopic(topicHref)
    }
  }

  // Navigates to previous topic in TOC
  exports.previousTopic = function previousTopic() {
    var topicHref = getPreviousTOCHref(currentTOCEntry)
    if (topicHref) {
      assimilateTopic(topicHref)
    }
  }
  
  // Main procedure
 
  // Polyfill for Edge (as of 2018-01-03): add missing forEach method to NodeList
  if (!NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach
  }

  // When document has loaded, initialize the borg
  window.addEventListener("load", initialize)
  
// End of object
})(pageborg)