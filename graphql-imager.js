/*
 * Parse command line arguments
 */

var USAGE = "Expected GraphQL shorthand notation on STDIN. Usage: graphql-imager (--html | --png)";

var argv = require('minimist')(
	process.argv.slice(2),
	{ boolean: ['html', 'png']
	}
);


var GraphQL = require('graphql');

// Read schema to string
fs=require('fs');
var SCHEMA = fs.readFileSync('/dev/stdin').toString();

// Parse schema to node graph
var parsed = GraphQL.parse(SCHEMA);

//console.log(parsed);


if(argv['html']) {

	var html = '<html>\n<head><style>\n';

	html += 'body {font-family: courier, monospace;}\n';
	html += 'li { list-style-type: none; }\n';
	
	html += '.comment { color: gray; }\n';
	
	html += '.typeKeyword {	color:red; }\n';
	html += '.enumKeyword {	color:magenta; }\n';
	html += '.unionKeyword {	color:purple; }\n';
	html += '.scalarKeyword {	color:cyan; }\n';
	
	html += '.type, .enum, .union, .scalar { color: blue; }\n';
	html += '.variable {	color: black; }\n';
	html += '.scalarVariable {	color: orange; }\n';
	html += '.typeVariable { color: green; }\n';
	html += '</style>\n</head>\n';
	
	html += '<body>\n';
	
	for(var itemIdx=0; itemIdx<parsed.definitions.length; itemIdx++) {
		var item = parsed.definitions[itemIdx];
		
		//html += '<!--'+JSON.stringify(item)+'-->\n';
		
		switch(item.kind) {
		case 'ObjectTypeDefinition':
		
			html += '<p><span class="typeKeyword">type</span> <span class="type">'+item.name.value+'</span> { \n';
			html += '<ul>\n';
			for(var fieldIdx=0; fieldIdx<item.fields.length; fieldIdx++) {
				field = item.fields[fieldIdx];
				
		html += '<!--'+JSON.stringify(field)+'-->\n';
				
				
				if(field.comments) {
					for(var commentIdx=0; commentIdx < field.comments.length; commentIdx++) {
						if(commentIdx==0) html += '<li>&nbsp;</li>';
						html += '<li class="comment">#'+field.comments[commentIdx].value+'</li>\n';
					}
				}
				
				html += '<li><span class="variable">'+field.name.value + '</span>';
				
				if(field.arguments && field.arguments.length > 0) {
					html += '(<i>';
					for(var argumentIdx=0; argumentIdx < field.arguments.length; argumentIdx++) {
						if (argumentIdx > 0) html += ', ';
						argument = field.arguments[argumentIdx];
						html += argument.name.value;
						html += ': ' + printVariableType(argument.type);
					}
					html += '</i>)';
				}
				
				
				var type = field.type;
				
				html += ': ' + printVariableType(type);
				
				html += '</li>\n';
			}
			html += '</ul>\n } </p>\n';
			
			break;
			
		case 'CommentDefinition':
			
			if(itemIdx>0 && parsed.definitions[itemIdx-1].kind!='CommentDefinition') html += '<p>&nbsp;</p>';
			html += '<p><span class="comment">#'+item.value+'</span></p>\n';
			break;
			
		case 'EnumTypeDefinition':
			html += '<p><span class="enumKeyword">enum</span> <span class="enum">'+item.name.value+'</span> { \n';
			html += '<ul>\n';
			
			for(var valueIdx=0; valueIdx<item.values.length; valueIdx++) {
				value = item.values[valueIdx];
				html +='<li>'+value.name.value+'</li>\n';
			}
			
			html += '</ul>\n } </p>\n';
			
			break;
			
		case 'UnionTypeDefinition':
			html += '<p><span class="unionKeyword">union</span> <span class="union">'+item.name.value+'</span> = \n';
			for(var typeIdx=0; typeIdx<item.types.length; typeIdx++) {
				type = item.types[typeIdx];
				if(typeIdx>0) html += ' | ';
				html += printVariableType(type);
			}
			
			html += '</p>\n';
			
			break;
			
		case 'ScalarTypeDefinition':
			html += '<p><span class="scalarKeyword">scalar</span> <span class="scalar">'+item.name.value+'</span></p>\n';
			break;
			
		default:
			html += "<p> unknown type</p>\n";
		}
		
		
	};
	
	
	html += '</body>\n</html>';
	
	console.log(html);
}

function printVariableType(type) {

	var html = '';
	var notNullBaseType = false;
	if(type.kind == 'NonNullType') { 
		notNullBaseType = true;
		type = type.type;
	}
	
	var listType = false;
	var notNullListType = false;
	if(type.kind == 'ListType') { 
		listType = true;
		html += '[';
		type = type.type;
		
		if(type.kind == 'NonNullType') { 
			notNullListType = true;
			type = type.type;
		}
	}
	
	
	if(type.kind == 'NamedType') {
		switch(type.name.value) {
			case "String":
			case "Boolean":
			case "Int":
			case "Float":
				html += '<span class="scalarVariable">'+type.name.value+'</span>';
				break;
				
			default:
				html += '<span class="typeVariable">'+type.name.value+'</span>';
				break;
			
		}
	}
	
	if(listType) {
		if(notNullListType) {
			html += '!';
		}
		html += ']';
	}
	
	if(notNullBaseType) {
		html += '!';
	}
	
	return html;
}


