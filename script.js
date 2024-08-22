
let map;
let roofSegmentMarkers = [];
let panelMarkers = [];
let mainLocationMarker;


function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: -34.397,
			lng: 150.644
		}, // Set default map location
		zoom: 5, // Set default map zoom
		streetViewControl: false,
		mapTypeControl: false,
		rotateControl: false,
		tilt: 0,
		styles: [{
			featureType: "all",
			elementType: "labels",
			stylers: [{
				visibility: "off"
			}]
		}],
		mapTypeId: 'satellite' // Set default map type to satellite

	});

	var input = document.getElementById('location-input');
	var autocomplete = new google.maps.places.Autocomplete(input);

	autocomplete.addListener('place_changed', function() {
		var place = autocomplete.getPlace();

		if (!place.geometry) {
			window.alert("Sorry, there's no coverage available for this address!: '" + place.name + "'");
			return;
		}
		// can call function to fetch solar data based on the location
		// Display roof segments and main location marker
		fetchSolarData(place.geometry.location.lat(), place.geometry.location.lng(), 'roof');
		map.setZoom(25);
		map.setCenter(place.geometry.location);
	});
}

function findSolar(type) {
	// Clear existing markers
	clearMarkers();

	const addressInput = document.getElementById("location-input").value;

	// Geocode the address to get the latitude and longitude
	const geocoder = new google.maps.Geocoder();
	geocoder.geocode({
		address: addressInput
	}, (results, status) => {
		if (status === "OK" && results[0]) {
			const location = results[0].geometry.location;
			// Now you can use the location (latitude and longitude) to make the Solar API request
			// Example: Call another function to fetch solar data based on the location and type
			fetchSolarData(location.lat(), location.lng(), type);
		} else {
			alert("Geocode was not successful for the following reason: " + status);
		}
	});
}

function fetchSolarData(latitude, longitude, type) {
	const apiUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&requiredQuality=HIGH&key={KEY}`;

	fetch(apiUrl)
		.then(response => response.json())
		.then(data => {
			console.log(data); // Log the data to the console for inspection
			// Process the data and update the map as needed
			// Example: Parse the response and update the map markers or polygons
			displayResultsOnMap(map, data, type);
		})
		.catch(error => console.error("Error fetching solar data:", error));
}

function displayResultsOnMap(map, data, type) {
	this.solarPanelPolygonReferences = new Map();
	this.solarPanelPolygons = [];
	let panelsCount = 0;
	let configIndex = 0;
	// Check if roofSegmentStats array exists in the data
	if (data && data.solarPotential.roofSegmentStats && Array.isArray(data.solarPotential.roofSegmentStats)) {
		console.log(data.solarPotential.roofSegmentStats);
		if (type === 'roof') {
			let slider = document.querySelector('.slider_con');
			slider.innerHTML = "";
			// Loop through roofSegmentStats and add markers to the map for roof segments

			data.solarPotential.roofSegmentStats.forEach(segment => {
				const segmentMarker = new google.maps.Marker({
					position: {
						lat: segment.center.latitude,
						lng: segment.center.longitude
					},
					map: map,
					title: 'Roof Segment',
				});
				map.setCenter({
					lat: segment.center.latitude,
					lng: segment.center.longitude
				});
				const solarDataDiv_chat = document.getElementById('yourParentContainerId');
                    	solarDataDiv_chat.innerHTML = '';
				// Attach a click event listener to the marker
				google.maps.event.addListener(segmentMarker, 'click', function() {
					const solarDataDiv = document.getElementById('solar_data');

					// Clear previous content
					solarDataDiv.innerHTML = '';
					
                    	
					// Create elements to display the data
					const areaMeters2Element = document.createElement('p');
					areaMeters2Element.textContent = 'Area meters2: ' + Math.floor(segment.stats.areaMeters2);

					const pitchDegreesElement = document.createElement('p');
					pitchDegreesElement.textContent = 'Pitch Degrees: ' + Math.floor(segment.pitchDegrees);

					const azimuthDegreesElement = document.createElement('p');
					azimuthDegreesElement.textContent = 'Azimuth Degrees: ' + Math.floor(segment.azimuthDegrees);

					// Append elements to the div
					solarDataDiv.appendChild(areaMeters2Element);
					solarDataDiv.appendChild(pitchDegreesElement);
					solarDataDiv.appendChild(azimuthDegreesElement);
				});


				roofSegmentMarkers.push(segmentMarker);
			});

			// Add a marker for the main location of the address
			mainLocationMarker = new google.maps.Marker({
				position: {
					lat: data.center.latitude,
					lng: data.center.longitude
				},
				map: map,
				title: 'Main Location',
			});

			google.maps.event.addListener(mainLocationMarker, 'click', function() {
				const solarDataDiv = document.getElementById('solar_data');
				solarDataDiv.innerHTML = '';

				// Create elements to display the main location data
				const sunshineHoursElement = document.createElement('p');
				sunshineHoursElement.textContent = 'Sunshine hours/year: ' + Math.floor(data.solarPotential.maxSunshineHoursPerYear);

				const areaMeters2Element = document.createElement('p');
				areaMeters2Element.textContent = 'Area meters2: ' + Math.floor(data.solarPotential.maxArrayAreaMeters2);

				const maxPanelsCountElement = document.createElement('p');
				maxPanelsCountElement.textContent = 'Max panels count: ' + Math.floor(data.solarPotential.maxArrayPanelsCount);

				// Append elements to the div
				solarDataDiv.appendChild(sunshineHoursElement);
				solarDataDiv.appendChild(areaMeters2Element);
				solarDataDiv.appendChild(maxPanelsCountElement);
			
			});
				
				const myElement = document.getElementById('panelMarker');
			     myElement.style.display = 'inline';

		} else if (type === 'panel') {
			// Remove the main location marker
			mainLocationMarker.setMap(null);
			const myElement = document.getElementById('panelMarker');
			 myElement.style.display = 'none';
			const solarDataDiv = document.getElementById('solar_data');
			solarDataDiv.innerHTML = '';


			// Find the existing div with the class "slider_con"
			const sliderContainer = document.querySelector('.slider_con');
			clearSolarPanels();

			// Create a parent div for all elements
			const sliderParentDiv = document.createElement("div");
			sliderParentDiv.className = "slider-container";
			sliderContainer.appendChild(sliderParentDiv);

			// Create and append the panel-count-label div
			const panelCountLabelElement = document.createElement("div");
			panelCountLabelElement.className = "panel-count-label";
			panelCountLabelElement.textContent = "Panels Count";
			sliderParentDiv.appendChild(panelCountLabelElement);

			// Create a slider input and append it to the parent div
			this.panelSliderElement = document.createElement("input");
			this.panelSliderElement.className = "solar-panels-panel-slider";
			this.panelSliderElement.type = "range";
			this.panelSliderElement.min = "0";
			this.panelSliderElement.max = (data.solarPotential.solarPanelConfigs.length) - 1;
			this.panelSliderElement.value = "0";
			this.panelSliderElement.step = "1";
			sliderParentDiv.appendChild(this.panelSliderElement);

			// Add an event listener to the slider input
			this.panelSliderElement.addEventListener("input", () => {
				// Clear existing solar panels on the map
				clearSolarPanels();
				solarpanlespl(data, parseInt(this.panelSliderElement.value));
			});

			// Create and append the slider-value div
			const sliderValueElement = document.createElement("div");
			sliderValueElement.className = "slider-value";
			sliderValueElement.textContent = "0";
			sliderParentDiv.appendChild(sliderValueElement);

            // Reference to the parent container
            const parentContainer = document.getElementById('yourParentContainerId');
        
            // Create the first div with the "panel_c" class and an h3 element
            const divOne = document.createElement('div');
            divOne.className = 'panel_c';
            
            const h3One = document.createElement('h3');
            h3One.className = 'solar-panels-panel-title';
            h3One.textContent = 'Panels count';
        
            // Create a div with class "panel_co_val" and append it after h3
            const panelValueDivOne = document.createElement('div');
            panelValueDivOne.className = 'panel_co_val';
        
            // Append the h3 and the div to the first div
            divOne.appendChild(h3One);
            divOne.appendChild(panelValueDivOne);
        
            // Create the second div with the "energy_c" class and an h3 element
            const divTwo = document.createElement('div');
            divTwo.className = 'energy_c';
            
            const h3Two = document.createElement('h3');
            h3Two.className = 'solar-panels-panel-title';
            h3Two.textContent = 'Energy';
        
            // Create a div with class "energy_co_val" and append it after h3
            const energyValueDivTwo = document.createElement('div');
            energyValueDivTwo.className = 'energy_co_val';
        
            // Append the h3 and the div to the second div
            divTwo.appendChild(h3Two);
            divTwo.appendChild(energyValueDivTwo);
        
            // Append the divs to the parent container
            parentContainer.appendChild(divOne);
            parentContainer.appendChild(divTwo);



			const solarPanelConfig = data.solarPotential.solarPanelConfigs[configIndex];
			solarpanlespl(data, configIndex);
		}
		map.setZoom(25);
	} else {
		console.error('Invalid data format or missing roofSegmentStats.');
	}
}

function solarpanlespl(data, configIndex) {
	this.solarPanelPolygonReferences = new Map();
	this.solarPanelPolygons = [];
	let panelsCount = 0;
	let energy = 0;
	// 	let configIndex = 0;
	const solarPanelConfig = data.solarPotential.solarPanelConfigs[configIndex];
	solarPanelConfig.roofSegmentSummaries.forEach((roofSegmentSummary) => {
		data.solarPotential.solarPanels.filter((solarPanel) => solarPanel.segmentIndex === roofSegmentSummary.segmentIndex).slice(0, Math.min(solarPanelConfig.panelsCount - panelsCount, roofSegmentSummary.panelsCount)).forEach((solarPanel) => {
			let height = data.solarPotential.panelHeightMeters / 2;
			let width = data.solarPotential.panelWidthMeters / 2;
			if (solarPanel.orientation === "LANDSCAPE") {
				const previousHeight = height;
				height = width;
				width = previousHeight;
			}
			const angle = roofSegmentSummary.azimuthDegrees;

			if (!this.solarPanelPolygonReferences.has(solarPanel)) {

				const center = {
					lat: solarPanel.center.latitude,
					lng: solarPanel.center.longitude
				};
				const top = google.maps.geometry.spherical.computeOffset(center, height, angle + 0);
				const right = google.maps.geometry.spherical.computeOffset(center, width, angle + 90);
				const left = google.maps.geometry.spherical.computeOffset(center, width, angle + 270);
				const topRight = google.maps.geometry.spherical.computeOffset(top, width, angle + 90);
				const bottomRight = google.maps.geometry.spherical.computeOffset(right, height, angle + 180);
				const bottomLeft = google.maps.geometry.spherical.computeOffset(left, height, angle + 180);
				const topLeft = google.maps.geometry.spherical.computeOffset(left, height, angle + 0);
				solarPanelPolygonReferences.set(solarPanel, new google.maps.Polygon({
					map: map,
					fillColor: "#2B2478",
					fillOpacity: 0.8,
					strokeWeight: 1,
					strokeColor: "#AAAFCA",
					strokeOpacity: 1,
					geodesic: false,
					paths: [
						topRight,
						bottomRight,
						bottomLeft,
						topLeft
					]
				}));
			}
			const polygon = solarPanelPolygonReferences.get(solarPanel);
			polygon.setMap(map);
			solarPanelPolygons.push(polygon);

		});
		panelsCount += roofSegmentSummary.panelsCount;
		energy += roofSegmentSummary.yearlyEnergyDcKwh;
		const slider_count_solar = document.querySelector('.slider-value');
		slider_count_solar.innerHTML = panelsCount;
		console.log("Current Panel Count:", panelsCount);
		
		// Assuming panelsCount and solarPotential.maxArrayPanelsCount are defined variables

        // Get the slider_chart_val element
        const slider_chart_val = document.querySelector('.panel_co_val');
        // Set the innerHTML dynamically with concatenated values
        slider_chart_val.innerHTML = panelsCount + ' / ' + data.solarPotential.maxArrayPanelsCount;
        
        //  // Get the slider_chart_val element
        const slider_chart_val_en = document.querySelector('.energy_co_val');
        // Set the innerHTML dynamically with concatenated values
        
        slider_chart_val_en.innerHTML =  Math.round(energy).toString() + " kwh";
	});
}

function clearSolarPanels() {
	// Clear existing solar panels from the map
	solarPanelPolygons.forEach(polygon => polygon.setMap(null));
	solarPanelPolygons = [];
	panelsCount = 0;
	solarPanelPolygonReferences.clear();
}

function clearMarkers() {
	// Clear roof segment markers
	roofSegmentMarkers.forEach(marker => marker.setMap(null));
	roofSegmentMarkers = [];

	// Clear solar panel markers
	panelMarkers.forEach(marker => marker.setMap(null));
	panelMarkers = [];
}