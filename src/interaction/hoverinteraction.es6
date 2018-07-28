/** Interaction hover do to something when hovering a feature
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @fires hover, enter, leave
 * @param {olx.interaction.HoverOptions}
 *	- cursor { string | undefined } css cursor propertie or a function that gets a feature, default: none
 *	- featureFilter {function | undefined} filter a function with two arguments, the feature and the layer of the feature. Return true to select the feature
 *	- layerFilter {function | undefined} filter a function with one argument, the layer to test. Return true to test the layer
 *	- handleEvent { function | undefined } Method called by the map to notify the interaction that a browser event was dispatched to the map. The function may return false to prevent the propagation of the event to other interactions in the map's interactions chain.
 *  - hitTolerance  { number | 2 } Tolerance to capture feature
 
 * develop https://github.com/Viglino/ol-ext/blob/master/src/interaction/Hover.js, to speed up the operation and add hit tolerance
 */
ol.interaction.Hover = function (options) {
	if (!options)
		options = {};
	const self = this;
	self.hitTolerance = options.hitTolerance || 2;

	ol.interaction.Interaction.call(self, {
		handleEvent: (e) => {
			if (e.type == "pointermove") {
				self.handleMove_(e);
			};
			if (options.handleEvent)
				return options.handleEvent(e);
			return true;
		}
	});

	self.setFeatureFilter(options.featureFilter);
	self.setLayerFilter(options.layerFilter);
	self.setCursor(options.cursor);
};
ol.inherits(ol.interaction.Hover, ol.interaction.Interaction);

/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol.interaction.Hover.prototype.setMap = function (map) {
	const self = this;
	if (self.previousCursor_ !== undefined && self.getMap()) {
		self.getMap().getTargetElement().style.cursor = self.previousCursor_;
		self.previousCursor_ = undefined;
	}
	ol.interaction.Interaction.prototype.setMap.call(self, map);
};

/**
 * Set cursor on hover
 * @param { string } cursor css cursor propertie or a function that gets a feature, default: none
 * @api stable
 */
ol.interaction.Hover.prototype.setCursor = function (cursor) {
	const self = this;
	if (!cursor && self.previousCursor_ !== undefined && self.getMap()) {
		self.getMap().getTargetElement().style.cursor = self.previousCursor_;
		self.previousCursor_ = undefined;
	}
	self.cursor_ = cursor;
};

/** Feature filter to get only one feature
 * @param {function} filter a function with two arguments, the feature and the layer of the feature. Return true to select the feature
 */
ol.interaction.Hover.prototype.setFeatureFilter = function (filter) {
	const self = this;
	if (typeof(filter) == 'function'){
		self.featureFilter_ = filter;
	}else {
		self.featureFilter_ = () => true;
	}
};

/** Feature filter to get only one feature
 * @param {function} filter a function with one argument, the layer to test. Return true to test the layer
 */
ol.interaction.Hover.prototype.setLayerFilter = function (filter) {
	const self = this;
	if (typeof(filter) == 'function'){
		self.layerFilter_ = filter;
	}else {
		self.layerFilter_ = () => true;
	}
};

/** Get features whenmove
 * @param {ol.event} e "move" event
 */
ol.interaction.Hover.prototype.handleMove_ = function (e) {
	const self = this;
	const map = self.getMap();
	if (map) {
		let feature, layer;		
		const b = map.forEachFeatureAtPixel(e.pixel, 
			(f, l) => {
				if (self.featureFilter_(f, l)) {
					feature = f;
					layer = l;
					return true;
				} else {
					feature = layer = null;
					return false;
				}
			}, {
				hitTolerance : self.hitTolerance,
				layerFilter : self.layerFilter_
			});

		if (b){
			self.dispatchEvent({
				type: "hover",
				feature: feature,
				layer: layer,
				coordinate: e.coordinate,
				pixel: e.pixel,
				map: e.map,
				dragging: e.dragging
			});
		}

		if (self.feature_ === feature && self.layer_ === layer) {			
		} else {
			self.feature_ = feature;
			self.layer_ = layer;
			if (feature){
				self.dispatchEvent({
					type: "enter",
					feature: feature,
					layer: layer,
					coordinate: e.coordinate,
					pixel: e.pixel,
					map: e.map,
					dragging: e.dragging
				});
			}else{
				self.dispatchEvent({
					type: "leave",
					coordinate: e.coordinate,
					pixel: e.pixel,
					map: e.map,
					dragging: e.dragging
				});
			}
		}

		if (self.cursor_) {
			const style = map.getTargetElement().style;
			if (b) {
				if (style.cursor != self.cursor_) {
					self.previousCursor_ = style.cursor;
					style.cursor = self.cursor_;
				}
			} else if (self.previousCursor_ !== undefined) {
				style.cursor = self.previousCursor_;
				self.previousCursor_ = undefined;
			}
		}
	}
};
