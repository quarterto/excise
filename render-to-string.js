const {html} = require('diffhtml');
const {registry} = require('./custom-elements');

const attrsToString = attrs => attrs.map(
	({name, value}) => ` ${name}="${value}"`
).join('');

const findAttr = (node, attr) => node.attributes.find(({name}) => name === attr) || {};
const hasAttr = (node, attr) => !!(findAttr(node, attr).name);
const getAttr = (node, attr) => findAttr(node, attr).value;
const setAttr = (node, attr, value) => {
	const attrObj = findAttr(node, attr);
	if(attrObj.name) {
		attrObj.value = value;
	} else {
		node.attributes.push({name: attr, value});
	}
}

const root = Symbol('root');

module.exports = function renderToString(node, slotMap = new Map()) {
	if(registry.has(node.nodeName)) {
		const Class = registry.get(node.nodeName);
		const element = new Class(node);

		node.slots = new Map();
		node.childNodes.forEach(child => {
			const slot = getAttr(child, 'slot') || root;

			if(node.slots.has(slot)) {
				node.slots.get(slot).push(child);
			} else {
				node.slots.set(slot, [child]);
			}
		});

		node.childNodes = [].concat(html`<span slot="__excise_rendered">
			${element.render(element.props, element)}
		</span>`, node.childNodes);
	}

	if(node.nodeName === 'slot') {
		const slotName = getAttr(node, 'name') || root;
		node.childNodes = [].concat(slotMap.get(slotName) || []);
	}

	const children = node.childNodes.map(
		child => renderToString(child, node.slots || slotMap)
	);

	if(node.nodeName === '#text') {
		return node.nodeValue;
	}

	return `<${node.nodeName}${attrsToString(node.attributes)}>
${children.join('')}
</${node.nodeName}>`
}
