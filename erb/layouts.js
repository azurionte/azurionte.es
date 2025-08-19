// layouts.js v1.0.16
console.log('[layouts.js] v1.0.16');
// Helper to toggle preview mode for sidebar layout
window.setSidebarPreviewMode = function(isPreview) {
	// Apply preview mode to both sidebar and top-fancy layouts if present
	const layouts = document.querySelectorAll('.sidebar-layout, .top-fancy-layout');
	layouts.forEach(layout => {
		const pencil = layout.querySelector('.profile-pencil');
		if (pencil) pencil.style.display = isPreview ? 'none' : 'block';
		const nameDisplay = layout.querySelector('.profile-name-display');
		const nameInput = layout.querySelector('.profile-name-input');
		if (nameDisplay) {
			nameDisplay.style.pointerEvents = isPreview ? 'none' : 'auto';
		}
		if (nameInput) {
			if (isPreview) nameInput.style.display = 'none';
		}
	});
};

// Available layouts
window.LAYOUT_OPTIONS = [
	{
		id: 'sidebar',
		name: 'Sidebar',
		render: renderSidebarLayout
	}
];

// Add Top Fancy layout option
window.LAYOUT_OPTIONS.push({
	id: 'top-fancy',
	name: 'Top Fancy',
	render: renderTopFancyLayout
});

// Top Fancy Layout Renderer
function renderTopFancyLayout(canvasEl) {
	if (!canvasEl) return;
	// clear previous layout
	const old = canvasEl.querySelector('.top-fancy-layout');
	if (old) old.remove();

	const root = document.createElement('div');
	root.className = 'top-fancy-layout';

	// Hero bar uses the same grape styling so it visually matches the sidebar
	const hero = document.createElement('div');
	hero.className = 'tf-hero sidebar-grape';
	root.appendChild(hero);

	// Create profile circle using the same structure as the sidebar (profile-circle, background, plus, file input, pencil)
	const profileCircle = document.createElement('div');
	profileCircle.className = 'profile-circle tf-profile-circle';

	const profileBg = document.createElement('div');
	profileBg.className = 'profile-bg';
	profileBg.style.display = 'none';

	const plusBtn = document.createElement('button');
	plusBtn.className = 'profile-plus';
	plusBtn.innerHTML = '<span>+</span>';

	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.accept = 'image/*';
	fileInput.style.display = 'none';

	const pencilIcon = document.createElement('span');
	pencilIcon.className = 'profile-pencil';
	pencilIcon.innerHTML = '&#9998;';
	// keep pencil visible so user can always open the file dialog
	pencilIcon.style.display = 'block';
	// ensure it's absolutely positioned so JS placement works predictably
	pencilIcon.style.position = 'absolute';

	profileCircle.appendChild(profileBg);
	profileCircle.appendChild(plusBtn);
	profileCircle.appendChild(fileInput);

	// create a wrapper so the circle can be centered at the hero bottom reliably
	const profileWrap = document.createElement('div');
	profileWrap.className = 'tf-profile-wrap';
	// compute hero/circle sizes early
	const heroHeight = 170;
	const circleSize = 170;
	// position wrapper relative to the hero: top:100% and translateY(-50%) will glue the center to the hero bottom
	profileWrap.style.position = 'absolute';
	profileWrap.style.left = '50%';
	profileWrap.style.top = '100%';
	profileWrap.style.transform = 'translate(-50%, -50%)';
	profileWrap.appendChild(profileCircle);
	// append the wrapper into the hero so it moves with hero size changes
	hero.appendChild(profileWrap);
	// append pencil into the hero (outside the circle) so JS can position it at the circle edge
	hero.appendChild(pencilIcon);

	// Name display / input reuse the existing sidebar classes so behavior is identical
	const nameDisplay = document.createElement('div');
	// include tf-name-display so hero-specific CSS applies (larger font, positioned inside hero)
	nameDisplay.className = 'profile-name-display placeholder tf-name-display';
	nameDisplay.tabIndex = 0;
	// restore saved name if available
	const savedName = localStorage.getItem('erb.profileName');
	if (savedName) {
		nameDisplay.classList.remove('placeholder');
		nameDisplay.innerText = savedName;
	} else {
		nameDisplay.innerText = 'Your name';
	}
	root.appendChild(nameDisplay);

	const nameInput = document.createElement('textarea');
	nameInput.className = 'profile-name-input';
	nameInput.rows = 3;
	nameInput.maxLength = 120;
	nameInput.style.display = 'none';
	nameInput.setAttribute('aria-label', 'Your name');
	root.appendChild(nameInput);

	function showInput() {
		nameDisplay.style.display = 'none';
		nameInput.style.display = 'block';
		nameInput.value = nameDisplay.classList.contains('placeholder') ? '' : nameDisplay.innerText;
		nameInput.focus();
		const val = nameInput.value; nameInput.value = ''; nameInput.value = val;
	}
	function hideInput() {
		const val = (nameInput.value || '').trim();
		nameInput.style.display = 'none';
		if (!val) {
			nameDisplay.classList.add('placeholder'); nameDisplay.innerText = 'Your name';
		} else {
			nameDisplay.classList.remove('placeholder'); nameDisplay.innerText = val;
		}
		nameDisplay.style.display = 'block';
		// persist name across layouts
		try { localStorage.setItem('erb.profileName', nameDisplay.classList.contains('placeholder') ? '' : nameDisplay.innerText); } catch(e) {}
	}
	nameDisplay.addEventListener('click', showInput);
	nameDisplay.addEventListener('focus', showInput);
	nameInput.addEventListener('blur', hideInput);
	nameInput.addEventListener('keydown', function(e) { if (e.key === 'Escape') nameInput.blur(); });

	// (profile circle positioned by its wrapper above)

	// name should sit inside the hero bar (visually above the circle center but within hero)
	// append name into hero so it is positioned relative to hero height changes
	hero.appendChild(nameDisplay);
	// rely on `.tf-name-display` CSS to position the name inside the hero; keep a high z-index
	nameDisplay.style.zIndex = 30;

	// restore saved profile image (if present) so layout switches keep the image
	(function restoreImage() {
		const saved = localStorage.getItem('erb.profileImage');
		if (!saved) return;
		const img = new Image();
		img.onload = function() {
			profileBg.dataset.nw = img.naturalWidth;
			profileBg.dataset.nh = img.naturalHeight;
			profileBg.style.backgroundImage = `url(${saved})`;
			profileBg.style.display = 'block';
			plusBtn.style.display = 'none';
			pencilIcon.style.display = 'block';
			profileBg._scale = 1; profileBg._posX = 0; profileBg._posY = 0;
			const minScale = Math.max(circleSize / img.naturalWidth, circleSize / img.naturalHeight);
			profileBg._scale = minScale; profileBg._nw = img.naturalWidth; profileBg._nh = img.naturalHeight;
			updateBackgroundTransformTF(profileBg);
			positionPencilTF();
		};
		img.src = saved;
	})();

	// attach into canvas
	canvasEl.appendChild(root);

	// click handlers for file input and pencil
	function openFileDialog() { fileInput.click(); }
	plusBtn.addEventListener('click', openFileDialog);
	pencilIcon.addEventListener('click', openFileDialog);

	// File input handler (reuse pattern from sidebar)
	fileInput.addEventListener('change', function(e) {
		const file = e.target.files[0]; if (!file) return;
		const reader = new FileReader();
		reader.onload = function(ev) {
			const url = ev.target.result;
			const img = new Image();
			img.onload = function() {
				profileBg.dataset.nw = img.naturalWidth; profileBg.dataset.nh = img.naturalHeight;
				profileBg.style.backgroundImage = `url(${url})`;
				profileBg.style.display = 'block'; plusBtn.style.display = 'none'; pencilIcon.style.display = 'block';
				// persist the data URL so switching layouts retains the image
				try { localStorage.setItem('erb.profileImage', url); } catch(e) { /* ignore storage errors */ }
				profileBg._scale = 1; profileBg._posX = 0; profileBg._posY = 0;
				const minScale = Math.max(circleSize / img.naturalWidth, circleSize / img.naturalHeight);
				profileBg._scale = minScale; profileBg._nw = img.naturalWidth; profileBg._nh = img.naturalHeight;
				updateBackgroundTransformTF(profileBg);
				positionPencilTF();
			};
			img.src = url;
		};
		reader.readAsDataURL(file);
	});

	// Background transform helpers and interactions for Top Fancy (similar to sidebar)
	function updateBackgroundTransformTF(bgEl) {
		const nw = Number(bgEl._nw || bgEl.dataset.nw || 1);
		const nh = Number(bgEl._nh || bgEl.dataset.nh || 1);
		const scale = Number(bgEl._scale || 1);
		const bw = nw * scale, bh = nh * scale;
		if (typeof bgEl._posX === 'undefined') bgEl._posX = (circleSize - bw) / 2;
		if (typeof bgEl._posY === 'undefined') bgEl._posY = (circleSize - bh) / 2;
		const minX = Math.min(0, circleSize - bw), minY = Math.min(0, circleSize - bh);
		bgEl._posX = Math.max(minX, Math.min(0, Number(bgEl._posX)));
		bgEl._posY = Math.max(minY, Math.min(0, Number(bgEl._posY)));
		bgEl.style.backgroundSize = `${bw}px ${bh}px`;
		bgEl.style.backgroundPosition = `${bgEl._posX}px ${bgEl._posY}px`;
	}
	let pDragging = false, pStartX = 0, pStartY = 0;
	profileBg.addEventListener('mousedown', function(e) { if (profileBg.style.display === 'none') return; pDragging = true; pStartX = e.clientX; pStartY = e.clientY; profileBg.style.cursor = 'grabbing'; e.preventDefault(); });
	window.addEventListener('mousemove', function(e) { if (!pDragging) return; const dx = e.clientX - pStartX, dy = e.clientY - pStartY; profileBg._posX = Number(profileBg._posX || 0) + dx; profileBg._posY = Number(profileBg._posY || 0) + dy; updateBackgroundTransformTF(profileBg); pStartX = e.clientX; pStartY = e.clientY; });
	window.addEventListener('mouseup', function() { if (!pDragging) return; pDragging = false; profileBg.style.cursor = 'grab'; });
	profileBg.addEventListener('wheel', function(e) { if (profileBg.style.display === 'none') return; e.preventDefault(); const delta = e.deltaY < 0 ? 1.08 : 0.92; const nw = Number(profileBg._nw || profileBg.dataset.nw || 1); const nh = Number(profileBg._nh || profileBg.dataset.nh || 1); const prevScale = profileBg._scale || 1; let newScale = prevScale * delta; const minScale = Math.max(circleSize / nw, circleSize / nh); const maxScale = 4; newScale = Math.max(minScale, Math.min(maxScale, newScale)); const rect = profileBg.getBoundingClientRect(); const cx = e.clientX - rect.left; const cy = e.clientY - rect.top; const bwPrev = nw * prevScale, bhPrev = nh * prevScale, bwNew = nw * newScale, bhNew = nh * newScale; const relX = (cx - profileBg._posX) / bwPrev, relY = (cy - profileBg._posY) / bhPrev; profileBg._posX = cx - relX * bwNew; profileBg._posY = cy - relY * bhNew; profileBg._scale = newScale; updateBackgroundTransformTF(profileBg); }, { passive: false });

	function positionPencilTF() {
		// compute pencil position so it visually anchors to the circle bottom-right
		const circleRect = profileCircle.getBoundingClientRect();
		const heroRect = hero.getBoundingClientRect();
		// compute coordinates relative to sidebar; offset pencil slightly outside the circle
		const left = (circleRect.right + circleRect.left) / 2 - heroRect.left + (circleRect.width / 4) - 12;
		const top = circleRect.bottom - heroRect.top - 12; // slightly above the white canvas
		pencilIcon.style.position = 'absolute';
		pencilIcon.style.left = `${left}px`;
		pencilIcon.style.top = `${top}px`;
	}
	// initial position (positioning will fallback to CSS when inside the circle)
	setTimeout(positionPencilTF, 0);
	window.addEventListener('resize', positionPencilTF);
}

// Sidebar Layout Renderer
function renderSidebarLayout(canvasEl) {
	if (!canvasEl) return;
	// Remove previous layout if any
	let oldSidebar = canvasEl.querySelector('.sidebar-layout');
	if (oldSidebar) oldSidebar.remove();

	// Set canvasEl to relative so sidebar is positioned inside
	canvasEl.style.position = 'relative';

	// Create sidebar container with grape gradient
	const sidebar = document.createElement('div');
	sidebar.className = 'sidebar-layout sidebar-grape';

	// Profile circle
	const profileCircle = document.createElement('div');
	profileCircle.className = 'profile-circle';

	// Plus button
	const plusBtn = document.createElement('button');
	plusBtn.className = 'profile-plus';
	plusBtn.innerHTML = '<span>+</span>';

		// Profile image (background wrapper for correct masking and control)
		const profileBg = document.createElement('div');
		profileBg.className = 'profile-bg';
		profileBg.style.display = 'none';

		// Pencil icon (placed as sibling so it can overlap the circle)
	const pencilIcon = document.createElement('span');
	pencilIcon.className = 'profile-pencil';
	pencilIcon.innerHTML = '&#9998;'; // Unicode pencil
	// keep pencil visible so user can always open the file dialog
	pencilIcon.style.display = 'block';

	// File input (hidden)
	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.accept = 'image/*';
	fileInput.style.display = 'none';

	// Add elements
		profileCircle.appendChild(profileBg);
		profileCircle.appendChild(plusBtn);
		profileCircle.appendChild(fileInput);
	// append the pencil as a sibling so it can be positioned outside the circle
	sidebar.appendChild(profileCircle);
	sidebar.appendChild(pencilIcon);

		// restore saved image for sidebar if present
		(function restoreSidebarImage() {
			const saved = localStorage.getItem('erb.profileImage');
			if (!saved) return;
			const img = new Image();
			img.onload = function() {
				profileBg.dataset.nw = img.naturalWidth;
				profileBg.dataset.nh = img.naturalHeight;
				profileBg.style.backgroundImage = `url(${saved})`;
				profileBg.style.display = 'block';
				plusBtn.style.display = 'none';
				pencilIcon.style.display = 'block';
				profileBg._scale = 1; profileBg._posX = 0; profileBg._posY = 0;
				const minScale = Math.max(170 / img.naturalWidth, 170 / img.naturalHeight);
				profileBg._scale = minScale; profileBg._nw = img.naturalWidth; profileBg._nh = img.naturalHeight;
				updateBackgroundTransform(profileBg);
				positionPencil();
			};
			img.src = saved;
		})();

		// Replace contenteditable with native textarea editing flow for reliable caret
		const nameDisplay = document.createElement('div');
		nameDisplay.className = 'profile-name-display placeholder';
		nameDisplay.tabIndex = 0;
		// restore saved name if available
		const savedName = localStorage.getItem('erb.profileName');
		if (savedName) {
			nameDisplay.classList.remove('placeholder');
			nameDisplay.innerText = savedName;
		} else {
			nameDisplay.innerText = 'Your name';
		}
		sidebar.appendChild(nameDisplay);

		const nameInput = document.createElement('textarea');
		nameInput.className = 'profile-name-input';
		nameInput.rows = 3;
		nameInput.maxLength = 120;
		nameInput.style.display = 'none';
		nameInput.setAttribute('aria-label', 'Your name');
		sidebar.appendChild(nameInput);

		function showInput() {
			nameDisplay.style.display = 'none';
			nameInput.style.display = 'block';
			nameInput.value = nameDisplay.classList.contains('placeholder') ? '' : nameDisplay.innerText;
			nameInput.focus();
			// move caret to end
			const val = nameInput.value;
			nameInput.value = '';
			nameInput.value = val;
		}

		function hideInput() {
			const val = (nameInput.value || '').trim();
			nameInput.style.display = 'none';
			if (!val) {
				nameDisplay.classList.add('placeholder');
				nameDisplay.innerText = 'Your name';
			} else {
				nameDisplay.classList.remove('placeholder');
				nameDisplay.innerText = val;
			}
			nameDisplay.style.display = 'block';
			// persist name across layouts
			try { localStorage.setItem('erb.profileName', nameDisplay.classList.contains('placeholder') ? '' : nameDisplay.innerText); } catch(e) {}
		}

		nameDisplay.addEventListener('click', showInput);
		nameDisplay.addEventListener('focus', showInput);
		nameInput.addEventListener('blur', hideInput);
		nameInput.addEventListener('keydown', function(e) {
			if (e.key === 'Escape') {
				nameInput.blur();
			}
		});
		// position pencil after layout
		canvasEl.appendChild(sidebar);
		// ensure the pencil is placed correctly once elements are in the DOM
		setTimeout(positionPencil, 0);

	// Plus/pencil click handler
	function openFileDialog() {
		fileInput.click();
	}
		plusBtn.addEventListener('click', openFileDialog);
		pencilIcon.addEventListener('click', openFileDialog);

	// File input handler
		// File input handler -> use background-image approach
		fileInput.addEventListener('change', function(e) {
			const file = e.target.files[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = function(ev) {
				const url = ev.target.result;
				// create an Image to read natural size
				const img = new Image();
				img.onload = function() {
					// store natural sizes on profileBg element
					profileBg.dataset.nw = img.naturalWidth;
					profileBg.dataset.nh = img.naturalHeight;
					// initialize bg params
					profileBg.style.backgroundImage = `url(${url})`;
					profileBg.style.display = 'block';
					plusBtn.style.display = 'none';
					pencilIcon.style.display = 'block';
					// persist the image so switching layouts keeps it
					try { localStorage.setItem('erb.profileImage', url); } catch(e) {}
					// reset transforms and positions
					profileBg._scale = 1;
					profileBg._posX = 0;
					profileBg._posY = 0;
					// initialize sizing to cover
					const circleSize = 170;
					const nw = img.naturalWidth, nh = img.naturalHeight;
					const minScale = Math.max(circleSize / nw, circleSize / nh);
					profileBg._scale = minScale;
					profileBg._nw = nw;
					profileBg._nh = nh;
					updateBackgroundTransform(profileBg);
					positionPencil();
				};
				img.src = url;
			};
			reader.readAsDataURL(file);
		});

					// Background transform helpers and interactions
					function updateBackgroundTransform(bgEl) {
						const circleSize = 170;
						const nw = Number(bgEl._nw || bgEl.dataset.nw || 1);
						const nh = Number(bgEl._nh || bgEl.dataset.nh || 1);
						const scale = Number(bgEl._scale || 1);
						const bw = nw * scale;
						const bh = nh * scale;
						// initial centered position
						if (typeof bgEl._posX === 'undefined') bgEl._posX = (circleSize - bw) / 2;
						if (typeof bgEl._posY === 'undefined') bgEl._posY = (circleSize - bh) / 2;
						const minX = Math.min(0, circleSize - bw);
						const minY = Math.min(0, circleSize - bh);
						bgEl._posX = Math.max(minX, Math.min(0, Number(bgEl._posX)));
						bgEl._posY = Math.max(minY, Math.min(0, Number(bgEl._posY)));
						bgEl.style.backgroundSize = `${bw}px ${bh}px`;
						bgEl.style.backgroundPosition = `${bgEl._posX}px ${bgEl._posY}px`;
					}

					// pan/zoom handlers on profileBg
					let pDragging = false, pStartX = 0, pStartY = 0;
					profileBg.addEventListener('mousedown', function(e) {
						if (profileBg.style.display === 'none') return;
						pDragging = true;
						pStartX = e.clientX;
						pStartY = e.clientY;
						profileBg.style.cursor = 'grabbing';
						e.preventDefault();
					});
					window.addEventListener('mousemove', function(e) {
						if (!pDragging) return;
						const dx = e.clientX - pStartX;
						const dy = e.clientY - pStartY;
						profileBg._posX = Number(profileBg._posX || 0) + dx;
						profileBg._posY = Number(profileBg._posY || 0) + dy;
						updateBackgroundTransform(profileBg);
						pStartX = e.clientX;
						pStartY = e.clientY;
					});
					window.addEventListener('mouseup', function() {
						if (!pDragging) return;
						pDragging = false;
						profileBg.style.cursor = 'grab';
					});
					profileBg.addEventListener('wheel', function(e) {
						if (profileBg.style.display === 'none') return;
						e.preventDefault();
						const delta = e.deltaY < 0 ? 1.08 : 0.92;
						const nw = Number(profileBg._nw || profileBg.dataset.nw || 1);
						const nh = Number(profileBg._nh || profileBg.dataset.nh || 1);
						const circleSize = 170;
						const prevScale = profileBg._scale || 1;
						let newScale = prevScale * delta;
						const minScale = Math.max(circleSize / nw, circleSize / nh);
						const maxScale = 4;
						newScale = Math.max(minScale, Math.min(maxScale, newScale));
						// adjust pos so zoom centers on cursor relative to circle
						const rect = profileBg.getBoundingClientRect();
						const cx = e.clientX - rect.left; // cursor x inside circle
						const cy = e.clientY - rect.top;
						const bwPrev = nw * prevScale;
						const bhPrev = nh * prevScale;
						const bwNew = nw * newScale;
						const bhNew = nh * newScale;
						// compute relative cursor ratio
						const relX = (cx - profileBg._posX) / bwPrev;
						const relY = (cy - profileBg._posY) / bhPrev;
						// new pos so the point under cursor stays under cursor
						profileBg._posX = cx - relX * bwNew;
						profileBg._posY = cy - relY * bhNew;
						profileBg._scale = newScale;
						updateBackgroundTransform(profileBg);
					}, { passive: false });

					// position pencil button relative to circle
					function positionPencil() {
						// if pencil is inside the circle, CSS handles its placement
						if (pencilIcon.parentElement === profileCircle) return;
						const rect = profileCircle.getBoundingClientRect();
						const sidebarRect = sidebar.getBoundingClientRect();
						// position pencil near bottom-right of circle, offset outside by 12px
						const left = rect.left - sidebarRect.left + rect.width - 12;
						const top = rect.top - sidebarRect.top + rect.height - 12;
						pencilIcon.style.position = 'absolute';
						pencilIcon.style.left = `${left}px`;
						pencilIcon.style.top = `${top}px`;
					}
					window.addEventListener('resize', positionPencil);

				// old img load handler removed; profileBg handles sizing now
}
