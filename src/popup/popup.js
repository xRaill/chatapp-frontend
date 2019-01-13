export class popup {

	constructor(args = {}) {
		if(!args.id) return console.error('[POPUP] Called without an id');
		
		this.id      = 'popup'+ args.id.charAt(0).toUpperCase() + args.id.slice(1);
		this.dom     = '#' + this.id;
		this.title   = this.dom + '-title';
		this.body    = this.dom + '-body';
		this.buttons = this.dom + '-buttons';

		$('body').append($(`
			<div id="`+ this.id +`" class="popup-wrapper valign-wrapper" style="display:none;">
				<div class="popup popup-`+ (args.size ? args.size : 'md') +` z-depth-5">
					<div class="popup-top">
						<div class="popup-close grey-text"`+ (args.closable === false ? ' style="display:none;"' : '') +`>
							<i class="material-icons waves-effect">close</i>
						</div>
						<h5 id="`+ this.id +`-title" class="center">`+ args.title +`</h5> 
					</div>
					<div id="`+ this.id +`-body" class="popup-body"></div>
					<div id="`+ this.id +`-buttons"></div>
				</div>
			</div>
		`));

		if(args.closable !== false) $(this.dom).on('click', (e) => {
			if($(e.target).hasClass('popup-wrapper')) return this.destroy();
			if($(e.target).parentsUntil('.popup-wrapper', '.popup-close').length) return this.destroy();
		});

		if(!args.hidden) this.show();
	}

	show() {
		$(this.dom).fadeIn();
	}

	hide() {
		$(this.dom).fadeOut();
	}

	destroy() {
		$(this.dom).fadeOut(() => {
			$(this.dom).remove();
			delete chatapp[this.id];
		});
	}

}