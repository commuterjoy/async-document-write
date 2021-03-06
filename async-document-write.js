/*
 * Asynchronous document.write
 *
 * 2010-10-12
 *
 * By Eli Grey, http://eligrey.com
 * Licensed under the X11/MIT License
 *   See LICENSE.md
 *
 * Usage:
 *   eval(document.write.START);
 *   document.write(html);
 *   eval(document.write.END);
 */

/*global document */

/*! @source http://purl.eligrey.com/github/async-document-write/blob/master/async-document-write.js*/

(function () {
	"use strict";
	
	try {
		0();
	} catch (e) {
		var err = e;
	}
	
	var filename = "fileName",
	stack        = "stack",
	stacktrace   = stack + "trace";
	
	if (filename in err || stacktrace in err || stack in err) {
	
		var doc        = document,
		anchor         = doc.createElement("a"),
		False          = !1,
		notReady       = !False,
		writeQueue     = [],
		nativeDocWrite = doc.write,
		getElemsByTag  = function (tag) {
			return doc.getElementsByTagName(tag);
		},
		head = getElemsByTag("head")[0],
		write,
		domReady = function () {
			if (notReady) {
				notReady = False;
				var writeTo = write.to,
				item = 0, len = writeQueue.length;
				
				for (; item < len; item++) {
					write.to = writeQueue[item++];
					write(writeQueue[item]);
					delete write.to;
				}
				writeQueue = null;
				write.to = writeTo;
			}
		},
		getErrorLocation = function (error) {
			var loc, replacer = function (stack, matchedLoc) {
				loc = matchedLoc;
			};
		
			if (filename in error) {
				loc = error[filename];
			} else if (stacktrace in error) { // Opera
				error[stacktrace].replace(/Line \d+ of .+ script (.*)/gm, replacer);
			} else if (stack in error) { // WebKit
				error[stack].replace(/at (.*)/gm, replacer);
				loc = loc.replace(/:\d+:\d+$/, ""); // remove line number
			}
			return loc;
		},
		slice = Array.prototype.slice,
		toStr = Object.prototype.toString,
	
		addEvtListener, remEvtListener, listener;
	
		if (doc.addEventListener && doc.removeEventListener) {
			addEvtListener = doc.addEventListener;
			remEvtListener = doc.removeEventListener;
			listener = function (evt) {
				remEvtListener.call(doc, evt.type, listener, False);
				domReady();
			};
			addEvtListener.call(doc, "DOMContentLoaded", listener, False);
			addEvtListener.call(doc, "load", listener, False);
		
		} else if (doc.attachEvent && doc.detachEvent) {
			addEvtListener = doc.attachEvent;
			remEvtListener = doc.detachEvent;
			listener = function () {
				remEvtListener.call(doc, "onload", listener);
			};
			addEvtListener.call(doc, "onload", listener);
		}
		
		write = doc.write = function () {
			var markup = slice.call(arguments).join(""),
			body       = getElemsByTag("body")[0],
			writeTo    = write.to;
			
			if (!body) {
				writeQueue.push(writeTo, markup);
				return;
			}
			
			if (writeTo) {
				anchor.href = getErrorLocation(writeTo); // normalize error URI
				var src = anchor.href,
				scripts = getElemsByTag("script"),
				node = doc.createElement("span");
				node.innerHTML = markup;
				
				for (var script = 0, len = scripts.length; script < len; script++) {
					anchor.href = scripts.item(script).src; // normalize script URI
					if (anchor.href === src) {
						var scriptNode = scripts.item(script), parent = scriptNode;
						
						while (parent = parent.parentNode) {
							if (parent === head) {
								body.insertBefore(node, body.firstChild);
								return;
							}
						}
						scriptNode.parentNode.insertBefore(node, scriptNode);
						return;
					}
				}
			} else {
				// script without document.write.to attempting to write to the body
				// before it exists - requires native magic
				nativeDocWrite.apply(doc, arguments);
			}
		};
		doc.writeln = function () {
			write.apply(this, slice.call(arguments).concat("\n"));
		};
		write.START = "try{0()}catch(e){document.write.to=e}";
		write.END   = "delete document.write.to";
	}
}());
