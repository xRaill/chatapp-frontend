const path = require('path');
const webpack = require('webpack');

module.exports = {
	mode: 'development',
	context: path.join(__dirname, 'src'),
	entry: {
		index: ['./index.html', './index.js', './style.css'],
		another: ['./login.js', './register.js', './main.js', './router.js', './chat.js']
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.html/, 
				loader: 'file-loader?name=[name].[ext]', 
			},
		]
	},
	optimization: {
		splitChunks: {
			// include all types of chunks
			chunks: 'all'
		}
	}
};