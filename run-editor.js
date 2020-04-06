import { XDocEditor } from './xdoceditor.js'

(function (root, tagTypesElement, tagTemplatesElement) {
	const vars = {}
	location.href.replace(
		/[?&]+([^=&]+)=([^&]*)/gi,
		(_, key, value) => {
			vars[key] = decodeURI(value).replace(/%2F/gi, '/')
		}
	)

	const tagTypes = JSON.parse(tagTypesElement.innerText)
	const tagTemplates = JSON.parse(tagTemplatesElement.innerText)
	const editor = new XDocEditor(root, tagTypes, tagTemplates)
	editor.load(vars.url)
})(
	document.getElementById("xdoceditor"),
	document.getElementById("tag-types"),
	document.getElementById("tag-templates")
)
