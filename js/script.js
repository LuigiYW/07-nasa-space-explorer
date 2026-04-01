// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Use your own API key here for higher request limits.
const API_KEY = 'MI0z2Wf9Ewongy9SzmvdSgzNt6ErVEnweUUCXFTr';
const APOD_ENDPOINT = 'https://api.nasa.gov/planetary/apod';

// Keep references to modal elements so we can update them quickly.
let modalOverlay;
let modalImage;
let modalTitle;
let modalDate;
let modalExplanation;

function createModal() {
	modalOverlay = document.createElement('div');
	modalOverlay.className = 'modal-overlay hidden';

	modalOverlay.innerHTML = `
		<div class="modal" role="dialog" aria-modal="true" aria-label="Space image details">
			<button class="modal-close" aria-label="Close modal">&times;</button>
			<img class="modal-image" src="" alt="" />
			<h2 class="modal-title"></h2>
			<p class="modal-date"></p>
			<p class="modal-explanation"></p>
		</div>
	`;

	document.body.appendChild(modalOverlay);

	modalImage = modalOverlay.querySelector('.modal-image');
	modalTitle = modalOverlay.querySelector('.modal-title');
	modalDate = modalOverlay.querySelector('.modal-date');
	modalExplanation = modalOverlay.querySelector('.modal-explanation');

	const closeButton = modalOverlay.querySelector('.modal-close');

	closeButton.addEventListener('click', closeModal);

	modalOverlay.addEventListener('click', (event) => {
		if (event.target === modalOverlay) {
			closeModal();
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
			closeModal();
		}
	});
}

function openModal(item) {
	modalImage.src = item.hdurl || item.url;
	modalImage.alt = item.title;
	modalTitle.textContent = item.title;
	modalDate.textContent = formatDisplayDate(item.date);
	modalExplanation.textContent = item.explanation;

	modalOverlay.classList.remove('hidden');
	document.body.classList.add('modal-open');
}

function closeModal() {
	modalOverlay.classList.add('hidden');
	document.body.classList.remove('modal-open');
}

function formatDisplayDate(dateString) {
	const date = new Date(`${dateString}T00:00:00`);
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

function showStatus(message, type = 'info') {
	gallery.innerHTML = `
		<div class="placeholder status ${type}">
			<div class="placeholder-icon">${type === 'error' ? '⚠️' : '🔭'}</div>
			<p>${message}</p>
		</div>
	`;
}

async function fetchApodByDateRange(startDate, endDate) {
	const url = `${APOD_ENDPOINT}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	const data = await response.json();
	const items = Array.isArray(data) ? data : [data];

	// APOD can return videos too, but this gallery is image-focused.
	return items
		.filter((item) => item.media_type === 'image')
		.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function createGalleryItem(item) {
	const card = document.createElement('article');
	card.className = 'gallery-item';
	card.tabIndex = 0;
	card.setAttribute('role', 'button');
	card.setAttribute('aria-label', `${item.title}, ${formatDisplayDate(item.date)}`);

	card.innerHTML = `
		<img src="${item.url}" alt="${item.title}" loading="lazy" />
		<p class="gallery-title">${item.title}</p>
		<p class="gallery-date">${formatDisplayDate(item.date)}</p>
	`;

	card.addEventListener('click', () => openModal(item));
	card.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openModal(item);
		}
	});

	return card;
}

function renderGallery(items) {
	if (items.length === 0) {
		showStatus('No APOD images found in this date range. Try another range!');
		return;
	}

	gallery.innerHTML = '';
	items.forEach((item) => {
		gallery.appendChild(createGalleryItem(item));
	});
}

async function handleGetSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showStatus('Please choose both a start date and end date.', 'error');
		return;
	}

	if (startDate > endDate) {
		showStatus('Start date must be earlier than or equal to end date.', 'error');
		return;
	}

	getImagesButton.disabled = true;
	getImagesButton.textContent = 'Loading...';
	showStatus('Fetching NASA images...');

	try {
		const items = await fetchApodByDateRange(startDate, endDate);
		renderGallery(items);
	} catch (error) {
		showStatus('Unable to load NASA images right now. Please try again.', 'error');
		console.error(error);
	} finally {
		getImagesButton.disabled = false;
		getImagesButton.textContent = 'Get Space Images';
	}
}

createModal();
getImagesButton.addEventListener('click', handleGetSpaceImages);

// Load the default date range immediately so students can see data right away.
handleGetSpaceImages();
