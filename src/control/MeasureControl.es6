ol.control.MeasureControl = function (opt_options) {
	const options = opt_options || {};
	const self = this;

	const button = document.createElement('button');
	self.type = options.type || 'LineString'; //'Polygon'

	const icon = document.createElement('span');
	icon.className = 'icon-measure';
	button.appendChild(icon);

	let active = false;
	self.ohelpTooltip = [];
	self.omeasureTooltip = [];

	button.addEventListener('click', () => {
		if (active) {
			self.clear.apply(self, arguments);
		} else {
			self.drawStart.apply(self, arguments);
		}
		active = !active;
	}, false);

	const element = document.createElement('div');
	element.className = 'ol-measure ol-unselectable ol-control';
	element.appendChild(button);
	element.setAttribute('data-toggle', 'tooltip');
	element.setAttribute('title', opt_options.tooltip || 'Mierzenie');

	ol.control.Control.call(self, {
		element: element,
		target: options.target
	});

	self.source = new ol.source.Vector();
	self.vector = new ol.layer.Vector({
			source: self.source,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: '#ffcc33',
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 7,
					fill: new ol.style.Fill({
						color: '#ffcc33'
					})
				})
			})
		});

	self.sketch;
	const continuePolygonMsg = opt_options.continuePolygonMsg || 'Kliknij, aby kontynuować rysowanie wielokąta';
	const continueLineMsg = opt_options.continueLineMsg || 'Kliknij, aby kontynuować rysowanie linii';
	self.pointerMoveHandler = (evt) => {
		if (!active) {
			return;
		}
		if (evt.dragging) {
			return;
		}
		let helpMsg = opt_options.helpMsg || 'Kliknij, aby rozpocząć rysowanie';

		if (self.sketch) {
			const geom = (self.sketch.getGeometry());
			if (geom instanceof ol.geom.Polygon) {
				helpMsg = continuePolygonMsg;
			} else if (geom instanceof ol.geom.LineString) {
				helpMsg = continueLineMsg;
			}
		}

		self.ohelpTooltip[self.ohelpTooltip.length - 1].get('element').innerHTML = helpMsg;
		self.ohelpTooltip[self.ohelpTooltip.length - 1].setPosition(evt.coordinate);

		self.ohelpTooltip[self.ohelpTooltip.length - 1].get('element').classList.remove('hidden');
	};

	self.draw = new ol.interaction.Draw({
			source: self.source,
			type: self.type,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 0.5)',
					lineDash: [10, 10],
					width: 2
				}),
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: 'rgba(0, 0, 0, 0.7)'
					}),
					fill: new ol.style.Fill({
						color: 'rgba(255, 255, 255, 0.2)'
					})
				})
			})
		});

	let listener;
	self.draw.on('drawstart', (evt) => {
		// set sketch
		self.sketch = evt.feature;

		/** @type {ol.Coordinate|undefined} */
		let tooltipCoord = evt.coordinate;

		listener = self.sketch.getGeometry().on('change', function (evt) {
			const geom = evt.target;
			let output;
			if (geom instanceof ol.geom.Polygon) {
				output = ol.control.MeasureControl.formatArea(geom);
				tooltipCoord = geom.getInteriorPoint().getCoordinates();
			} else if (geom instanceof ol.geom.LineString) {
				output = ol.control.MeasureControl.formatLength(geom);
				tooltipCoord = geom.getLastCoordinate();
			}
			self.omeasureTooltip[self.omeasureTooltip.length - 1].get('element').innerHTML = output;
			self.omeasureTooltip[self.omeasureTooltip.length - 1].setPosition(tooltipCoord);
		}, self);
	}, self);
	self.draw.on('drawend', function () {
		self.omeasureTooltip[self.omeasureTooltip.length - 1].get('element').className = 'ol-measure-tooltip ol-measure-tooltip-static';
		self.omeasureTooltip[self.omeasureTooltip.length - 1].setOffset([0, -7]);
		// unset sketch
		self.sketch = null;
		self.createMeasureTooltip();
		ol.Observable.unByKey(listener);
	}, self);
};
ol.inherits(ol.control.MeasureControl, ol.control.Control);
ol.control.MeasureControl.prototype.setMap = function (map) {	
	const self = this;
	ol.control.Control.prototype.setMap.call(self, map);

	if (map) {
		map.addLayer(self.vector);

		map.on('pointermove', self.pointerMoveHandler, self);

		map.getViewport().addEventListener('mouseout', function () {
			if (self.ohelpTooltip && self.ohelpTooltip.length > 0)
				self.ohelpTooltip[self.ohelpTooltip.length - 1].get('element').classList.add('hidden');
		});
	}
};
ol.control.MeasureControl.prototype.createHelpTooltip = function () {
	const helpTooltipElement = document.createElement('div');
	helpTooltipElement.className = 'ol-measure-tooltip hidden';
	const helpTooltip = new ol.Overlay({
			element: helpTooltipElement,
			offset: [15, 0],
			positioning: 'center-left'
		});
	this.ohelpTooltip.push(helpTooltip);
	this.getMap().addOverlay(helpTooltip);
};
ol.control.MeasureControl.prototype.createMeasureTooltip = function () {
	const measureTooltipElement = document.createElement('div');
	measureTooltipElement.className = 'ol-measure-tooltip ol-measure-tooltip-measure';
	const measureTooltip = new ol.Overlay({
			element: measureTooltipElement,
			offset: [0, -15],
			positioning: 'bottom-center'
		});
	this.omeasureTooltip.push(measureTooltip);
	this.getMap().addOverlay(measureTooltip);
};
ol.control.MeasureControl.prototype.clear = function () {
	const self = this;
	
	self.omeasureTooltip.forEach((measureTooltip) => self.getMap().removeOverlay(measureTooltip));
	self.ohelpTooltip.forEach((helpTooltip) => self.getMap().removeOverlay(helpTooltip));

	self.omeasureTooltip = [];
	self.ohelpTooltip = [];
	self.source.clear();

	self.getMap().removeInteraction(self.draw);
};
ol.control.MeasureControl.prototype.drawStart = function () {
	this.createMeasureTooltip();
	this.createHelpTooltip();

	this.getMap().addInteraction(this.draw);
};

ol.control.MeasureControl.formatLength = function (line) {
	const length = ol.Sphere.getLength(line);
	let output;
	if (length > 100) {
		output = (Math.round(length / 1000 * 100) / 100) +
		' ' + 'km';
	} else {
		output = (Math.round(length * 100) / 100) +
		' ' + 'm';
	}
	return output;
};
ol.control.MeasureControl.formatArea = function (polygon) {
	const area = ol.Sphere.getArea(polygon);
	let output;
	if (area > 10000) {
		output = (Math.round(area / 1000000 * 100) / 100) +
		' ' + 'km<sup>2</sup>';
	} else {
		output = (Math.round(area * 100) / 100) +
		' ' + 'm<sup>2</sup>';
	}
	return output;
};
