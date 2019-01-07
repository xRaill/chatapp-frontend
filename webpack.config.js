const webpack = require('webpack');
const path = require('path');

module.exports = {
	mode: 'development',
	context: path.join(__dirname, 'src'),
	entry: {
		index: ['./index.html', './index.js', './style.css'],
		another: ['./login.js', './register.js', './main.js', './router.js']
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.html/, 
				loader: 'file-loader?name=[name].[ext]', 
			},
			{
				test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: 'url-loader?limit=10000&mimetype=application/font-woff'
			},
			{
				test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: 'file-loader'
			}
		]
	},
	optimization: {
		splitChunks: {
			chunks: 'all'
		}
	}
};