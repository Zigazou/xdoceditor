function xmlAttributesToAssociativeArray(xmlAttributes) {
	const attributes = {}
	for(let xmlAttribute of xmlAttributes) {
		attributes[xmlAttribute.name] = xmlAttribute.value
	}
	return attributes
}

export class HTMLXML {
	constructor(root, tagTypes) {
		this.root = root
		this.tagTypes = tagTypes
	}

	clear() {
		this.root.innerHTML = ""
	}

	newDiv(className, editable) {
		const div = document.createElement("div")
		div.className = className
	
		if (editable) {
			div.setAttribute("contenteditable", "true")
		}
	
		return div
	}
	
	newText(value) {
		const text = this.newDiv("text")
		text.dataset.name = "text"
	
		text.appendChild(this.newDiv("text-handle"))
	
		const textContent = this.newDiv("text-content", true)
		textContent.innerText = value
		text.appendChild(textContent)
	
		return text
	}

	newAttribute(name, value) {
		const tag = this.newDiv("tag-attribute")
	
		const tagAttributeName = this.newDiv("tag-attribute-name")
		tagAttributeName.innerText = name
		tag.appendChild(tagAttributeName)
	
		const tagAttributeValue = this.newDiv("tag-attribute-value", true)
		tagAttributeValue.innerText = value
		tag.appendChild(tagAttributeValue)
	
		return tag
	}

	newTag(type, attributes, populate) {
		const tagType = this.tagTypes[type]
	
		if (type === "#text") return this.newText("")
	
		const tag = this.newDiv("tag")
		//tag.setAttribute("draggable", "true")
		tag.dataset.name = type
		tag.dataset.count = '0'
		tag.dataset.type = tagType.type
	
		if (tagType.contains.length === 1 && tagType.contains[0] === "text") {
			tag.dataset.text = "true"
		}
	
		// Tag name.
		const tagName = this.newDiv("tag-name")
		tagName.innerText = type
		tag.appendChild(tagName)
	
		// Tag attributes.
		if (tagType.attributes.length === 0) {
			// No attribute.
			tag.dataset.attrs = "0"
		} else {
			const tagAttributes = this.newDiv("tag-attributes")
	
			if (tagType.attributes.length === 1) {
				// Only one attribute.
				tag.dataset.attrs = "1"
			} else {
				// Many attributes.
				tag.dataset.attrs = "n"
			}
	
			for (let attribute of tagType.attributes) {
				if (attribute in attributes) {
					tagAttributes.appendChild(
						this.newAttribute(attribute, attributes[attribute])
					)
				} else {
					tagAttributes.appendChild(
						this.newAttribute(attribute, "")
					)
				}
			}
	
			tag.appendChild(tagAttributes)
		}
	
		// Tag content.
		const content = this.newDiv("tag-content")

		// Populate if needed.
		if (populate && tagType.contains.includes("text")) {
			content.appendChild(this.newText(""))
			tag.dataset.count = 1
		}
	
		tag.appendChild(content)
	
		return tag
	}

	mayContain(tag, child) {
		const alloweds = this.tagTypes[tag.dataset.name].contains
		return alloweds.includes(child.dataset.name)
	}

	addTag(tag, child) {
		const content = tag.getElementsByClassName("tag-content")[0]

		if (!this.mayContain(tag, child)) {
			alert("Error: '" + child.dataset.name + "' tag cannot be added to '" + tag.dataset.name + "' tag ")
			return false
		}

		tag.dataset.count = parseInt(tag.dataset.count) + 1
		content.appendChild(child)
		return true
	}
	
	_importXMLChildren(parentTag, xmlChildren) {
		for(let xmlChild of xmlChildren) {
			let childTag
	
			if (xmlChild.nodeType === Node.TEXT_NODE) {
				if (this.tagTypes[parentTag.dataset.name].contains.includes("text")) {
					childTag = this.newText(xmlChild.wholeText)
					this.addTag(parentTag, childTag)
				}
			}
	
			if (xmlChild.nodeName in this.tagTypes) {
				childTag = this.newTag(
					xmlChild.nodeName,
					xmlAttributesToAssociativeArray(xmlChild.attributes)
				)
				this._importXMLChildren(childTag, xmlChild.childNodes)
				this.addTag(parentTag, childTag)
				continue
			}
		}
	}

	importXML(xml) {
		this.clear()
		const parent = xml.children[0]
		const parentTag = this.newTag(
			parent.tagName,
			xmlAttributesToAssociativeArray(parent.attributes)
		)
	
		this._importXMLChildren(parentTag, parent.childNodes)
	
		this.root.appendChild(parentTag)
	}

	_exportXMLNode(xml, parent, tag) {
		const tagName = tag.dataset.name

		if (tagName === "text") {
			parent.appendChild(document.createTextNode(
				tag.innerText.replace(/[\t\r\n ]+$/, " ")
			))
			return
		}

		const tagAttributes = tag.querySelector(".tag-attributes")
		const tagContent = tag.querySelector(".tag-content")
		const node = document.createElementNS("", tagName)

		if (tagAttributes !== null) {		
			for (let tagAttribute of tagAttributes.children) {
				if (tagAttribute.nodeType === Node.TEXT_NODE) continue
				node.setAttribute(
					tagAttribute.querySelector(".tag-attribute-name").innerText,
					tagAttribute.querySelector(".tag-attribute-value").innerText
				)
			}
		}

		for (let tagChild of tagContent.children) {
			this._exportXMLNode(xml, node, tagChild)
		}

		parent.appendChild(node)
	}

	getXSL() {
		console.log(this.root)
		return this.root.querySelector(".stylesheet-url").innerText
	}

	exportXML(xsl) {
		const xml = document.implementation.createDocument(null, "", null)

		xml.appendChild(
			document.createProcessingInstruction(
				"xml",
				'version="1.0" encoding="UTF-8"'
			)
		)

		// Add the XSL stylesheet if any.
		if (xsl) {
			xml.appendChild(
				document.createProcessingInstruction(
					"xml-stylesheet",
					'href="' + xsl + '" type="text/xsl"'
				)
			)
		}

		this._exportXMLNode(xml, xml, this.root.children[0])

		return xml
	}

	focus(element) {
		const first = element.querySelector("[contenteditable='true']")
		if (first !== null) first.focus()
	}
}
