import _ from 'lodash';

export class login {

	constructor() {

		let self = this;

		let app = `
			<div class="row valign-wrapper h-3">
				<div class="col s10 offset-s1 m4 offset-m4 card blue lighten-2">		
					<form class="card-content center-align" id="login-form">
						<span class="card-title">Login</span>
							<div class="input-field">
								<input type="text" id="login-username">
								<label class="white-text" for="login-username">Username</label>
								<span class="helper-text red-text scale-transition scale-out" id="login-username-helper">test</span>
							</div>
							<div class="input-field">
								<input type="password" id="login-password">
								<label class="white-text" for="login-password">Password</label>
								<span class="helper-text red-text scale-transition scale-out" id="login-password-helper">test</span>
							</div>
						<div class="card-action">
							<button class="btn waves-effect waves-light" id="login-submit">Login</button>
						</div>
						<a class="waves-effect waves-teal btn-flat text-small" data-route="register">No account?</a>
					</form>
				</div>
			</div>
		`;

		chatapp.page = 'login';

		// Display page with fade
		$('#app').fadeOut(() => {
			$('#app').html(app).fadeIn(() => {
				self.events();
			});
		});
	}

	events() {

		$('#login-submit').on('click', (e) => {
			e.preventDefault();

			// Disable input and make button pulse
			$('#login-form input').prop('disabled', true);
			$('#login-submit').addClass(['pulse', 'green']);
			
			let username = $('#login-username').val();
			let password = $('#login-password').val();

			let err = {u:0,p:0};

			// Check for errors
			if      (!username)            err.u = 'Niet ingevuld!';
			else if (username.length <  5) err.u = 'Te kort!';
			else if (username.length > 18) err.u = 'Te lang!';

			if      (!password)             err.p = 'Niet ingevuld!';
			else if (password.length <  5) err.p = 'Te kort!';
			else if (password.length > 30) err.p = 'Te lang!';

			// If error display error
			if(err.u || err.p) {
				if(err.u) $('#login-username-helper').text(err.u).removeClass('scale-out').parent().children('input').one('change', () => {
					$('#login-username-helper').addClass('scale-out');
				});
				if(err.p) $('#login-password-helper').text(err.p).removeClass('scale-out').parent().children('input').one('change', () => {
					$('#login-password-helper').addClass('scale-out');
				});

				$('#login-form input').prop('disabled', false);
				$('#login-submit').removeClass(['pulse', 'green']);
				
				return false;
			}

			// Small delay
			setTimeout(() => {
				// Check login info
				chatapp.socket.emit('action', 'login', {
					username: username,
					password: password
				}, (data) => {
					if(data.success) {
						localStorage.setItem('username', data.username);
						localStorage.setItem('userId', data.userId);
						localStorage.setItem('authToken', data.token);
						chatapp.router.goTo('main');
					} else {
						$('#login-form input').prop('disabled', false);
						$('#login-submit').removeClass(['pulse', 'green']);
						chatapp.toast('red', 'warning', data.error);
					}
				});
			}, 1000);

		});

	}

}