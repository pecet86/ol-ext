/**
* @constructor
* @extends {ol.control.Control}
* @param {Object=} opt_options Control options.
*/
ol.control.ExportPDFControl = function(opt_options) {
	const self = this;
	const options = opt_options || {};

	const button = document.createElement('button');
	button.className = 'glyphicon glyphicon-export';
	button.setAttribute('download', options.downloadName || 'export_pdf');

	self.exportPDFElement = button;

	const element = document.createElement('div');
	element.className = 'export-pdf ol-unselectable ol-control';
	element.appendChild(button);
	element.setAttribute('data-toggle', 'tooltip');
	element.setAttribute('title', options.tooltip || 'Export PDF');
	

	ol.control.Control.call(this, {
		element: element,
		target: options.target
	});

};
ol.inherits(ol.control.ExportPDFControl, ol.control.Control);


ol.control.ExportPDFControl.prototype.exportPDFConfigure = function(raster){
	const self = this;
	const download = self.exportPDFElement.getAttribute('download');
	const source = raster.getSource();
	const map = self.getMap();
	
	const dims = {
		a0: [1189, 841],
		a1: [841, 594],
		a2: [594, 420],
		a3: [420, 297],
		a4: [297, 210],
		a5: [210, 148]
	};

	let loading = 0;
	let loaded = 0;

	self.exportPDFElement.addEventListener('click', () => {
		//this.getMap().getView().setRotation(0);

		self.exportPDFElement.setAttribute("disabled", true);
		document.body.style.cursor = 'progress';

		const format = 'a4';
		const resolution = 72;
		const dim = dims[format];
		const width = Math.round(dim[0] * resolution / 25.4);
		const height = Math.round(dim[1] * resolution / 25.4);
		const size = /** @type {ol.Size} */ (map.getSize());
		const extent = map.getView().calculateExtent(size);
		
		
		let loader = null;
		function createExport(time, canvas){
			loader = window.setTimeout(function () {
				loading = 0;
				loaded = 0;
					
				try{					
					const data = canvas.toDataURL('image/png');
					const pdf = new jsPDF('landscape', undefined, format);
					pdf.addImage(data, 'JPEG', 0, 0, dim[0], dim[1]);
					pdf.save(`${download}.pdf`);				
				}catch(err){
					console.log(err);
				}finally{
					source.un('tileloadstart', tileLoadStart);
					source.un('tileloadend', tileLoadEnd, canvas);
					source.un('tileloaderror', tileLoadEnd, canvas);
					map.setSize(size);
					map.getView().fit(extent, size);
					map.renderSync();
					self.exportPDFElement.removeAttribute("disabled");
					document.body.style.cursor = 'auto';
				}
			}, time);
		}
		function clearExport(){
			if(loader) {
				clearTimeout(loader);
				loader = null;
			}
		}
		
		const tileLoadStart = function () {
			loading++;
			clearExport();			
		};
		const tileLoadEnd = function () {
			const canvas = this;
			loaded++;
			if(loaded == loading) createExport(100, canvas);
		};

		map.once('postcompose', function (event) {
			const canvas = event.context.canvas;
			
			source.on('tileloadstart', tileLoadStart);
			source.on('tileloadend', tileLoadEnd, canvas);
			source.on('tileloaderror', tileLoadEnd, canvas);
			
			createExport(1000, canvas);
		});

		map.setSize([width, height]);
		map.getView().fit(extent, /** @type {ol.Size} */(map.getSize()));
		map.renderSync();
	}, false);
}