let popup = require('./popup.js').popup;

export class confirm {

	constructor(args = {}) {
		this.popup = new popup({
			id:      'confirm',
			title:    args.title ? args.title : 'Confirm',
			size:    'sm',
			closable: false
		});

		$(this.popup.body).html($(`
			<div class="valign-wrapper" style="height:100%">
				<span class="center-block center">`+ args.message +`</span>
			</div>
		`));

		$(this.popup.buttons).html($(`
			<div class="cancel btn red waves-effect left">Cancel</div>
			<div class="confirm btn green waves-effect right">Confirm</div>
		`));

		$(this.popup.buttons).find('.confirm').on('click', () => {
			this.popup.destroy();
			if(args.callback instanceof Function) args.callback(true);
		});

		$(this.popup.buttons).find('.cancel').on('click', () => {
			this.popup.destroy();
			if(args.callback instanceof Function) args.callback(false);
		});
	}

}