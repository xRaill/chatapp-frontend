export class popup {

	constructor(name) {
		if(!name) return console.error('[POPUP] Called without a name');
		this.name = name;
		this.id = 'popup'+ name.charAt(0).toUpperCase() + name.slice(1);

		this.content = $(`
			<div id="`+ this.id +`" class="popup-wrapper valign-wrapper" style="display:none;">
				<div class="popup z-depth-5">
					<div class="popup-top">
						<div class="popup-close grey-text"><i class="popup-close material-icons waves-effect">close</i></div>
						<h5 id="`+ this.id +`-title" class="center"></h5> 
					</div>
					<div id="`+ this.id +`-body" class="popup-body"></div>
				</div>
			</div>
		`);

		this.content.on('click', (e) => {
			if($(e.target).hasClass('popup-wrapper')) return this.destroy();
			if($(e.target).parentsUntil('.popup-wrapper', '.popup-close').length) return this.destroy();
		});

		$('#'+ this.id).remove();
		$('body').append(this.content);
	}

	update(a, b) {
		let content = {
			title: (val) => $('#'+ this.id + '-title').text(val),
			body:  (val) => $('#'+ this.id + '-body').html(val)
		}

		if(typeof a === 'string') content[a](b);
		else {
			if(a.title) content.title(a.title);
			if(a.body)  content.body(a.body);
		}
	}

	show() {
		this.content.fadeIn();
	}

	hide() {
		this.content.fadeOut();
	}

	destroy() {
		this.content.fadeOut(() => {
			$('#'+ this.id).remove();
			delete chatapp[this.id];
		});
	}

}