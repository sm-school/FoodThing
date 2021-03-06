'use strict';

function getMenuFuncs () {
	let itemCount = 0;
	let menuData = {};
	let orderTotal = 0;

	const funcs = {
		incrementItemCount () {
			itemCount++;
			return itemCount;
		},
		getItemCount () {
			return itemCount;
		},
		storeMenuData (data) {
			menuData = data;
		},
		getMenuData () {
			return menuData;
		},
		storeOrderTotal (value) {
			orderTotal = value;
		},
		getOrderTotal () {
			return orderTotal;
		}
	}

	return funcs;
}

const menuFuncs = getMenuFuncs();

function setElementContent(id, content) {
	document.getElementById(id).innerHTML = content;
}

function formatPhoneNumber (number, format) {
	if (format === 'input') {
		number = number.replace(/\D/g, '');
		return number.replace(/^0/, '+44');
	} else if (format === 'output') {
		return number.replace(/\+44(\d{4})(\d{6})/, '0$1 $2');
	}
}

function createPageItem (args) {
	if (args.noShow) return;

	let parent         = args.parent;
	let itemType       = args.type || 'div';
	let itemId         = args.cssId;
	let itemClass      = args.cssClass;
	let itemContent    = args.content;
	let itemListener   = args.listener;
	let dataAttributes = args.dataAttributes;

	let item = document.createElement(itemType);

	if (parent)         parent.appendChild(item);
	if (itemId)         item.setAttribute('id', itemId);
	if (itemClass)      item.setAttribute('class', itemClass);
	if (itemContent)    item.innerHTML = itemContent;
	if (dataAttributes) {
		for (const [key, value] of Object.entries(dataAttributes)) {
			item.setAttribute(`data-${key}`, value);
		}
	}

	if (itemListener) {
		let event = itemListener.event;
		let func = itemListener.func;
		item.addEventListener(event, func);
	}

	return item;
}

function createPageGroup (...items) {
	let parent = items.shift();

	items.forEach(pageItem => {
		pageItem.parent = parent;
		createPageItem(pageItem);
	});
}

export function renderMenu (data) {
	let menu = document.getElementById('menu');
	let menuGroups = data.groups;

	Object.keys(menuGroups).forEach(group => {
		createMenuGroup(group, menuGroups)
	});

	createTotals(menu, menuFuncs.getItemCount());

	createPhoneNumberBlock(menu);

	let submitOrderButton = createPageItem({
		parent: menu,
		type: 'button',
		cssId: 'submit-order',
		content: 'Place order',
		listener: {
			event: 'click',
			func: () => { submitOrder() }
		}
	});

	updateDisplayTotal(); // with values loaded into quantity pickers
}

function createPhoneNumberBlock (menu) {
	let phoneNumberForm = createPageItem({
		parent: menu,
		type: 'form',
		cssId: 'phone-number-form'
	});

	let phoneNumberInput = createPageItem({
		parent: phoneNumberForm,
		type: 'input',
		cssId: 'phone-number-input',
		listener: {
			event: 'keydown',
			func: (e) => {
				if (e.keyCode === 13) e.preventDefault();
			}
		}
	});

	let phoneNumberLabel = createPageItem({
		parent: phoneNumberForm,
		type: 'label',
		cssId: 'phone-number-label',
		content: 'Please enter your phone number:'
	});

	phoneNumberLabel.setAttribute('for', 'phone-number-input');
	phoneNumberInput.setAttribute('type', 'text');
}

function createMenuGroup (group, menuGroups) {
	let groupDiv = createPageItem({
		parent: menu,
		cssId: `group-${group.toLowerCase()}`,
		cssClass: 'menu-group'
	});

	let groupTitle = createPageItem({
		parent: groupDiv,
		type: 'h2',
		content: group,
	});

	let currentGroup = menuGroups[group];

	Object.keys(currentGroup).forEach(name => {
		menuFuncs.incrementItemCount();
		let currentItem = currentGroup[name];
		createMenuItem(groupDiv, name, currentItem);
	});
}

function createTotals (menu, itemCount) {
	createPageGroup(
		createPageItem({
			parent: menu,
			cssId: 'subtotal'
		}),
		{
			cssId: 'subtotal-value',
			content: '£0.00'
		},
		{
			cssId: 'subtotal-label',
			content: 'Subtotal'
		}
	);

	createPageGroup(
		createPageItem({
			parent: menu,
			cssId: 'delivery-charge'
		}),
		{
			cssId: 'delivery-charge-value',
			content: '£5.00'
		},
		{
			cssId: 'delivery-charge-label',
			content: 'Delivery charge'
		}
	);

	createPageGroup(
		createPageItem({
			parent: menu,
			cssId: 'total-price',
		}),
		{
			cssId: 'total-price-value',
			content: '£5.00'
		},
		{
			cssId: 'total-price-label',
			content: 'Order total'
		}
	);
}

function createMenuItem (groupDiv, name, currentItem) {
	let description = currentItem.description;
	let price = currentItem.price;
	let size = currentItem.size;
	let itemId = currentItem.id;

	// To do: put identifiers into menu data and use them here
	// instead of counting items as they come into use
	let menuData = menuFuncs.getMenuData();
	menuData[itemId] = { name: name, price: price };
	menuFuncs.storeMenuData(menuData);

	let itemDiv = createPageItem({
		parent: groupDiv,
		cssId: `item-${itemId}`,
		cssClass: 'item-group',
		dataAttributes: { 'price' : price }
	});

	createQuantityPicker(itemDiv, `item-${itemId}-quantity`);

	createPageItem({
		parent: itemDiv,
		cssId: `item-${itemId}-price`,
		cssClass: 'item-price',
		content: '£' + price
	});

	let itemTitle = createPageItem({
		parent: itemDiv,
		cssClass: 'item-title',
		content: name
	});

	createPageItem({
		parent: itemTitle,
		type: 'span',
		cssClass: 'item-size',
		content: ` (${size})`,
		noShow: size ? undefined : 1
	});

	createPageItem({
		parent: itemDiv,
		cssClass: 'item-description',
		content: description,
		noShow: description ? undefined : 1
	});
}

function createQuantityPicker (parent, identifier) {
	let storedItemQuantity = localStorage[identifier];

	let itemQuantity = storedItemQuantity
		? storedItemQuantity
		: '0';

	createPageGroup(
		createPageItem({
			parent: parent,
			type: 'div',
			cssClass: 'quantity-picker'
		}),
		{
			cssId: `${identifier}-down`,
			cssClass: 'quantity-change',
			content: '➖', // '-'
			listener: {
				event: 'click',
				func: () => { updateQuantities(identifier, -1) }
			}
		},
		{
			cssId: identifier,
			cssClass: 'item-quantity',
			content: itemQuantity
		},
		{
			cssId: `${identifier}-up`,
			cssClass: 'quantity-change',
			content: '➕', // '+'
			listener: {
				event: 'click',
				func: () => { updateQuantities(identifier, 1); }
			}
		}
	);
}

function updateQuantities (identifier, change) {
	let value = Number(localStorage[identifier]);

	if (value === 0 && change < 0) return;

	let newValue = value + change;
	setElementContent(identifier, newValue);

	localStorage[identifier] = newValue;

	updateDisplayTotal();
}

function updateDisplayTotal () {
	let menuData = menuFuncs.getMenuData();
	let subtotal = 0;

	// To do: refactoring candidate: related code in submitOrder(), createQuantityPicker()
	let itemQuantities = document.querySelectorAll('.item-quantity');

	itemQuantities.forEach( item => {
		let identifier = item.getAttribute('id');
		let itemId = identifier.replace(/item-(.*?)-quantity/, '$1');

		let price = menuData[itemId].price;
		let quantity = localStorage[identifier];

		subtotal += (price * quantity);
	});

	let deliveryCharge = 5;
	let totalPrice = subtotal + deliveryCharge;

	let submitOrderButton = document.getElementById('submit-order');

	if (totalPrice === deliveryCharge) {
		submitOrderButton.disabled = true;
	} else {
		submitOrderButton.disabled = false;
	}

	menuFuncs.storeOrderTotal(totalPrice);
	setElementContent('subtotal-value', '£' + subtotal.toFixed(2));
	setElementContent('total-price-value', '£' + totalPrice.toFixed(2));
}

function submitOrder () {
	let totalItems = menuFuncs.getItemCount();

	let order = {};
	let itemQuantities = document.querySelectorAll('.item-quantity');

	itemQuantities.forEach(item => {
		let identifier = item.getAttribute('id');

		let storedItemQuantity = localStorage[identifier];

		let itemQuantity = storedItemQuantity
			? storedItemQuantity
			: 0;

		order[identifier.replace('-quantity', '')] = itemQuantity;
	});

	let orderData = { order: order };

	let userPhone = formatPhoneNumber(
		document.getElementById('phone-number-input').value,
		'input'
	);

	orderData.userPhone = userPhone;
	orderData.totalPrice = menuFuncs.getOrderTotal();

	fetch('/submitOrder', {
		body: JSON.stringify(orderData),
		headers: {
			'content-type': 'application/json'
		},
		method: 'POST',
	})
		.then( response => {
			return response.json();
		})
		.then( json => {
			if (json.success) orderReceived(orderData);
		})
		.catch( error => {
			document.write(`Couldn't submit order: ${error}.`);
		});
}

// To do: intermediate step of orderConfirmation()
function orderReceived (orderData) {
	let menu = document.getElementById('menu');

	while (menu.firstChild) {
		menu.removeChild(menu.firstChild);
	}

	let userPhone = formatPhoneNumber(orderData.userPhone, 'output');

	let menuData = menuFuncs.getMenuData();

	createPageGroup(
		menu,
		{
			type: 'h1',
			content: 'Order received'
		},
		{
			cssClass: 'confirmation-message',
			content: `Thanks for your order! We've sent a confirmation text to you at ${userPhone}. You're getting:`
		},
		{
			type: 'ul',
			cssId: 'order-list'
		}
	);

	let order = orderData.order;

	Object.keys(order).forEach( orderItem => {
		let itemNumber = orderItem.replace('item-', '');

		if (order[orderItem] === 0) return;

		createPageItem({
			parent: document.getElementById('order-list'),
			type: 'li',
			content: `${order[orderItem]} × ${menuData[itemNumber].name}`,
			noShow: orderItem ? undefined : 1
		});
	});

	let orderTotal = menuFuncs.getOrderTotal().toFixed(2);

	createPageItem({
		parent: menu,
		cssClass: 'confirmation-message',
		content: `Your order total was &pound;${orderTotal}.`
	});
}
