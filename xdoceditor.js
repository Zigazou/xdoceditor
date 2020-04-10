import { HTMLXML } from './htmlxml.js'
import { Commands } from './commands.js'

const authorizedUrlCharacters =
	'/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'

function validUrlChar(c) {
	return authorizedUrlCharacters.indexOf(c) >= 0
}

function validUrlDoc(url) {
	if (url === null || url === '') return false
	if (url[0] !== '/') return false
	if (url.substr(-4) !== ".xml" || url.substr(-5, 1) === "/") return false
	return [...url].every(validUrlChar)
}

export class XDocEditor {
	constructor(root, tagTypes, tagTemplates) {
		this.root = root
		this.xmlURL = ""

		// Create the tree editor.
		const container = document.createElement("div")
		container.className = "xdoceditor"
		this.tree = new HTMLXML(container, tagTypes)
		this.root.appendChild(container)

		// XSL field.
		this.xslField = this.root.querySelector(".stylesheet-url")

		// Create the commands.
		this.commands = new Commands(this.tree, tagTemplates)

		// Install the event handler.
		const options = { "passive": true }
		container.addEventListener("click", (e) => this.onClick(e), options)
		container.addEventListener("focusout", () => this.preview(), options)

		document.querySelector(".commands-menu-new").addEventListener(
			"click",
			() => this.newFile()
		)

		document.querySelector(".commands-menu-preview").addEventListener(
			"click",
			() => this.preview()
		)

		document.querySelector(".commands-menu-save").addEventListener(
			"click",
			() => this.save()
		)
	}

	load(fromURL, newURL="") {
		if (!validUrlDoc(fromURL)) {
			alert("Invalid URL")
			return
		}

		if (newURL !== "" && !validUrlDoc(newURL)) {
			alert("Invalid new URL")
			return
		}

		this.xmlURL = newURL ? newURL : fromURL

		document.querySelector(".menu-pageurl").innerText = this.xmlURL

		if (!this.xmlURL) return;
		fetch(fromURL)
			.then(response => {
				if (response.status !== 200) {
					throw new Error(fromURL + " not found")
				}
				return response.text()
			})
			.then(str => (new DOMParser()).parseFromString(str, "text/xml"))
			.then(xml => {
				const editorURL = location.href.replace(/\?.*$/, "")
				const fileURL = editorURL + "?url=" + encodeURI(this.xmlURL)
				window.history.pushState("", "", fileURL)

				for (let node of xml.childNodes) {
					if (node.nodeType !== Node.PROCESSING_INSTRUCTION_NODE) continue
					if (node.target !== "xml-stylesheet") continue

					this.xslField.innerText = node.data.match(/href="([^"]*)"/)[1]
					break
				}

				this.tree.importXML(xml)
				this.preview()
			})
			.catch(error => {
				alert(error)
			})
	}

	save() {
		const xml = this.tree.exportXML(this.xslField.innerText)
		const xmlSerializer = new XMLSerializer()
		const putSave = {
			"method": "PUT",
			"headers": { "Content-Type": "text/xml; charset=UTF-8" },
			"body": xmlSerializer.serializeToString(xml)
		}

		fetch(this.xmlURL, putSave)
		   .then(response => response.text())
		   .then(data => console.log(data))
		   .catch(err => console.log(err))
	}

	preview() {
		fetch(this.xslField.innerText)
			.then(response => response.text())
			.then(str => (new DOMParser()).parseFromString(str, "text/xml"))
			.then(xsl => {
				const xml = this.tree.exportXML()
				const previewDiv = document.getElementById("xdoceditor-preview")

				const xsltProcessor = new XSLTProcessor()
				xsltProcessor.importStylesheet(xsl)
				const preview = xsltProcessor.transformToFragment(xml, document)

				if (previewDiv.shadowRoot === null) {
					previewDiv.attachShadow({ mode: 'open' })
				} else {
					previewDiv.shadowRoot.innerHTML = ""
				}

				previewDiv.shadowRoot.appendChild(preview)
			})
			.catch(error => console.log(error))
	}

	newFile() {
		let playAgain = true
		let url = ""

		while (playAgain) {
			url = prompt('URL of the new file')
			if (url === null) return;

			if (validUrlDoc(url)) {
				playAgain = false
			} else {
				alert("Invalid URL")
			}
		}

		this.load("/xdoceditor/new.xml", url)
	}

	onClick(e) {
		const element = e.target

		if (e.ctrlKey) {
			if (!element.classList.contains("tag-name")) {
				return
			}
			element.parentNode.classList.toggle("tag-content-hide")
			return
		}

		if (!element.classList.contains("tag-name") &&
			!element.classList.contains("text-handle")) {
			return
		}

		this.commands.show(
			e.clientX + this.root.scrollLeft - this.root.offsetLeft,
			e.clientY + this.root.scrollTop - this.root.offsetTop,
			element
		)
	}
}
