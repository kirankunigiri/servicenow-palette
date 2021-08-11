const path = require("path")
const glob = require("glob")
const webpack = require("webpack")
const CopyPlugin = require("copy-webpack-plugin")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")

module.exports = {
	mode: 'production',
	entry: glob.sync('./src/**/*.js').reduce(function(obj, el) {
		obj[path.parse(el).name] = el
		return obj
	},{}),

	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist")
	},
	plugins: [
		new CopyPlugin({
			patterns: [{
				from: "*",
				to: path.resolve(__dirname, "dist"),
				context: path.resolve(__dirname, "src"),
				force: true
			}]
		})
	],
	// optimization: {
	// 	minimize: false,
	// 	splitChunks: {
	// 		chunks: "all"
	// 	}
	// }
}