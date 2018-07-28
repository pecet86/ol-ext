/** Interaction DragAndDropDom do to creates a feature where the element DOM is dragged
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @fires addfeature
 * @param {olx.interaction.DragAndDropDomOptions}
 *	- source { ol.source.Vector | undefined } , default: none
 *	- features {ol.Collection | undefined} , default: none
 *	- keyDnD {string | 'keyDnD'} key to add data from dragged, default: 'keyDnD'
 *	- target { DOM | undefined } element DOM, default: none
 */
ol.interaction.DragAndDropDom = function (opt_options) {

	const options = opt_options ? opt_options : {};

	ol.interaction.Interaction.call(this, {
		handleEvent: ol.interaction.DragAndDropDom.handleEvent
	});

	this.dropListenKeys_ = null;

	this.source_ = options.source || null;
	this.features_ = options.features ? options.features : null;	
	this.keyDnD_ = options.keyDnD || 'keyDnD';
	this.target = options.target ? options.target : null;
};
ol.inherits(ol.interaction.DragAndDropDom, ol.interaction.Interaction);

ol.interaction.DragAndDropDom.handleDrop_ = function (event) {
	const map = this.getMap();
	const coords = map.getEventCoordinate(event);
	let data;
	
	try{
		data = JSON.parse(event.dataTransfer.getData(this.keyDnD_));
	}catch(err){
		return false;
	}
	this.handleResult_(data, coords);
};
ol.interaction.DragAndDropDom.handleStop_ = function (event) {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';
};
ol.interaction.DragAndDropDom.prototype.handleResult_ = function (data, coords) {
	const self = this;
	let feature;
	
	feature = new ol.Feature(new ol.geom.Point(coords));
	feature[self.keyDnD_] = data;

	self.dispatchEvent({
		type : 'addfeature',
		feature : feature,
		data : data
	});
			
	if (self.source_) {
		self.source_.addFeature(feature);
	}
	if (self.features_) {
		self.features_.push(feature);
	}
};

/**
 * Activate or deactivate the interaction.
 * @param {boolean} active Active.
 * @observable
 * @api
 */
ol.interaction.DragAndDropDom.prototype.setActive = function (active) {
	ol.interaction.Interaction.prototype.setActive.call(this, active);
	if (active) {
		this.registerListeners_();
	} else {
		this.unregisterListeners_();
	}
};

/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol.interaction.DragAndDropDom.prototype.setMap = function (map) {
	this.unregisterListeners_();
	ol.interaction.Interaction.prototype.setMap.call(this, map);
	if (this.getActive()) {
		this.registerListeners_();
	}
};

ol.interaction.DragAndDropDom.handleEvent = () => true;
ol.interaction.DragAndDropDom.prototype.dragPointType = function(event, data){
	event.dataTransfer.setData(this.keyDnD_, JSON.stringify(data));
}
ol.interaction.DragAndDropDom.prototype.registerListeners_ = function () {
	const self = this;
	const map = self.getMap();
	if (map) {
		const dropArea = self.target ? self.target : map.getViewport();
		
		self.dropListenKeys_ = [{
			type : 'drop', 
			method : ol.interaction.DragAndDropDom.handleDrop_.bind(self)
		},{
			type : 'dragenter', 
			method : ol.interaction.DragAndDropDom.handleStop_.bind(self)
		},{
			type : 'dragover', 
			method : ol.interaction.DragAndDropDom.handleStop_.bind(self)
		},{
			type : 'drop', 
			method : ol.interaction.DragAndDropDom.handleStop_.bind(self)
		}];
		
		self.dropListenKeys_.forEach((v) => dropArea.addEventListener(v.type, v.method));
	}
};
ol.interaction.DragAndDropDom.prototype.unregisterListeners_ = function () {
	if (this.dropListenKeys_) {
		this.dropListenKeys_.forEach((v) => dropArea.removeEventListener(v.type, v.method));
		this.dropListenKeys_ = null;
	}
};