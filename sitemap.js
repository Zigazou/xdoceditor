export class Sitemap {
    constructor(url="/sitemap.xml") {
		this.url = url
		this.xml = null
		this.index = {}
    }

	_doIndexSitemap() {
		const urlset = this.xml.documentElement
		const urls = urlset.childNodes

		this.index = {}
		for (let urlsIndex = 0; urlsIndex < urls.length; urlsIndex++) {
			let url = urls[urlsIndex]
			if (url.nodeType !== Node.ELEMENT_NODE) continue
			if (url.nodeName !== 'url') continue

			const values = url.childNodes
			for (let valIndex = 0; valIndex < values.length; valIndex++) {
				if (values[valIndex].nodeType !== Node.ELEMENT_NODE) continue
				if (values[valIndex].nodeName === 'loc') {
					this.index[values[valIndex].textContent] = url
					break
				}
			}
		}
	}

    load() {
		return fetch(this.url)
			.then(response => {
				if (response.status !== 200) {
					throw new Error(this.url + " not found")
				}
				return response.text()
			})
			.then(str => (new DOMParser()).parseFromString(str, "text/xml"))
			.then(xml => {
				this.xml = xml
				this._doIndexSitemap()
			})
			.catch(error => alert(error))
	}

	setEntry(pageURL, lastmod) {
		const ns = this.xml.lookupNamespaceURI(null)
		let url = null
		if (!(pageURL in this.index)) {
			url = document.createElementNS(ns, "url")
			url.appendChild(document.createElementNS(ns, "loc"))
			url.appendChild(document.createElementNS(ns, "lastmod"))

			this.xml.documentElement.appendChild(url)
			this.index[pageURL] = url
		} else {
			url = this.index[pageURL]
		}

		url.getElementsByTagNameNS(ns, "loc")[0].textContent = pageURL
		url.getElementsByTagNameNS(ns, "lastmod")[0].textContent = lastmod
	}

	save() {
		const xmlSerializer = new XMLSerializer()
		const putSave = {
			"method": "PUT",
			"headers": { "Content-Type": "text/xml; charset=UTF-8" },
			"body": xmlSerializer.serializeToString(this.xml)
		}

		fetch(this.url, putSave)
			.then(response => response.text())
			.then(data => console.log(data))
			.catch(err => console.log(err))
	}
}
