export class Commands {
	constructor(htmlxml, tagTemplates) {
		this.tree = htmlxml
		this.clipboard = null
		this.currentElement = null
		this.insertTagSelect = null
		this.tagTemplates = tagTemplates
		this._initElements()
	}

	_setClickHandle(element, handlerName, tagList) {
		element.addEventListener("click", e => {
			if (tagList) {
				const selected = tagList.options[tagList.selectedIndex].value
				this[handlerName](this.currentElement, selected)
			} else {
				this[handlerName](this.currentElement)
			}

			this.hide()
		})
	}

	_updateTagList(target, tagList, favorite) {
		const tagType = target.dataset.name
		tagList.innerText = ""

		if (!tagType ||
			tagType === "text" ||
			this.tree.tagTypes[tagType].contains.length === 0) {
			for (let element of tagList.parentNode.children) {
				element.classList.add("commands-unavailable")
			}
			return
		}

		const templateGroup = document.createElement("optgroup")
		templateGroup.setAttribute("label", "Templates")

		const tagGroup = document.createElement("optgroup")
		tagGroup.setAttribute("label", "Tags")

		tagList.appendChild(templateGroup)
		tagList.appendChild(tagGroup)

		// Adds any allowed tag type.
		this.tree.tagTypes[tagType].contains.sort().forEach(tag => {
			let option = document.createElement("option")
			if (tag === "text") tag = "#text"
			option.value = tag
			option.text = tag
			tagGroup.appendChild(option)
		})

		// Adds any allowed template.
		for (let templateName in this.tagTemplates) {
			let template = this.tagTemplates[templateName]

			if (!this.tree.tagTypes[tagType].contains.includes(template.tag)) continue

			let option = document.createElement("option")
			option.value = templateName
			option.text = templateName
			templateGroup.appendChild(option)
		}

		tagList.value = favorite

		// Removes any unavailable class.
		for (let element of tagList.parentNode.children) {
			element.classList.remove("commands-unavailable")
		}
	}

	_initElements() {
		this.root = document.querySelector(".commands")

		// Title bar
		const close = document.querySelector(".commands-titlebar-close")
		close.addEventListener("click", () => this.hide())

		this.title = document.querySelector(".commands-titlebar-title")

		// Delete
		const removeOne = document.querySelector(".commands-delete-one")
		this._setClickHandle(removeOne, "removeOne")

		const removeNext = document.querySelector(".commands-delete-next")
		this._setClickHandle(removeNext, "removeNext")

		// Cut, copy, paste
		const cut = document.querySelector(".commands-ccp-cut", "cut")
		this._setClickHandle(cut, "cut")

		const copy = document.querySelector(".commands-ccp-copy", "copy")
		this._setClickHandle(copy, "copy")

		const pasteBefore = document.querySelector(".commands-ccp-paste-before")
		this._setClickHandle(pasteBefore, "pasteBefore")

		const pasteInside = document.querySelector(".commands-ccp-paste-inside")
		this._setClickHandle(pasteInside, "pasteInside")

		const pasteAfter = document.querySelector(".commands-ccp-paste-after")
		this._setClickHandle(pasteAfter, "pasteAfter")

		// Insertion
		this.siblingTagSelect = document.querySelector(".commands-sibling-tags")
		this.insideTagSelect = document.querySelector(".commands-inside-tags")

		const insertBefore = document.querySelector(".commands-sibling-before")
		this._setClickHandle(insertBefore, "insertBefore", this.siblingTagSelect)

		const insertAfter = document.querySelector(".commands-sibling-after")
		this._setClickHandle(insertAfter, "insertAfter", this.siblingTagSelect)

		const insertInside = document.querySelector(".commands-inside-insert")
		this._setClickHandle(insertInside, "insertInside", this.insideTagSelect)
	}

	show(x, y, element) {
		// Position the window.
		this.root.style.left = x + "px"
		this.root.style.top = y + "px"

		// Set title.
		if (element.classList.contains("text")) {
			this.title.innerText = "Unnamed element"
		} else {
			this.title.innerText = "Element: " + element.innerText
		}

		this.currentElement = element.parentNode
		const parentElement = this.currentElement.parentNode.parentNode

		const tagName = this.currentElement.dataset.name
		this._updateTagList(
			parentElement,
			this.siblingTagSelect,
			tagName === "text" ? "" : this.tree.tagTypes[tagName].favnext
		)
		this._updateTagList(
			this.currentElement,
			this.insideTagSelect,
			tagName === "text" ? "" : this.tree.tagTypes[tagName].favinside
		)

		this.root.classList.add("open")

		// Ensure all the commands window is visible.
		const rect = this.root.getBoundingClientRect()
		if ((rect.bottom > this.root.parentNode.offsetHeight)) {
			this.root.parentNode.scrollTop += rect.height
		}
	}

	hide() {
		this.currentElement = null
		this.root.classList.remove("open")
	}

	removeOne(element) {
		element.remove()
	}

	removeNext(element) {
		let next = true
		while (next) {
			next = element.nextSibling
			element.remove()
			element = next
		}
	}

	cut(element) {
		this.clipboard = element
		element.remove()
	}

	copy(element) {
		this.clipboard = element
	}

	pasteBefore(element) {
		if (this.clipboard === null) return;

		element.parentNode.insertBefore(this.clipboard.cloneNode(true), element)
	}

	pasteInside(element) {
		if (this.clipboard === null) return;

		element.querySelector(".tag-content").appendChild(
			this.clipboard.cloneNode(true)
		)
	}

	pasteAfter(element) {
		if (this.clipboard === null) return;

		element.parentNode.insertBefore(
			this.clipboard.cloneNode(true),
			element.nextSibling
		)
	}

	_getElementToInsert(tagType) {
		if (tagType === "#text") {
			return this.tree.newText("")
		}

		if (this.tree.tagTypes[tagType]) {
			return this.tree.newTag(tagType, [], true)
		}

		const templateRoot = this.tagTemplates[tagType].tag
		const element = this.tree.newTag(templateRoot, [])
		for (let child of this.tagTemplates[tagType].children) {
			let childTag
			if (child === "text") {
				childTag = this.tree.newText("")
			} else {
				childTag = this.tree.newTag(child, [], true)
			}
			this.tree.addTag(element, childTag)
		}

		return element
	}

	insertBefore(element, tagType) {
		const sibling = this._getElementToInsert(tagType)

		sibling.classList.add("hidden")
		element.parentNode.insertBefore(sibling, element)
		const _ = sibling.offsetWidth

		sibling.classList.remove("hidden")
		this.tree.focus(sibling)
	}

	insertInside(element, tagType) {
		const child = this._getElementToInsert(tagType)

		child.classList.add("hidden")
		this.tree.addTag(element, child)
		const _ = child.offsetWidth

		child.classList.remove("hidden")
		this.tree.focus(child)
	}

	insertAfter(element, tagType) {
		const sibling = this._getElementToInsert(tagType)

		sibling.classList.add("hidden")
		element.parentNode.insertBefore(sibling, element.nextSibling)
		const _ = sibling.offsetWidth

		sibling.classList.remove("hidden")
		this.tree.focus(sibling)
	}

	getElement() {
		return this.root
	}
}
