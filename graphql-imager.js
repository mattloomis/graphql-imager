/*
 * Parse command line arguments
 */

var USAGE = "Expected GraphQL shorthand notation on STDIN. Usage: graphql-imager (--html | --png)";

var argv = require('minimist')(
	process.argv.slice(2),
	{ boolean: ['html', 'dot']
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
						html += ': ' + printVariableType(argument.type, true);
					}
					html += '</i>)';
				}
				
				html += ': ' + printVariableType(field.type, true);
				
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
				html += printVariableType(type, true);
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




} else if(argv['dot']) {


	var dot = 'digraph graphql { \n';
	dot += '  node[shape=record];\n';
	
	var enums = [];
	var scalars = [];
	
	for(var itemIdx=0; itemIdx<parsed.definitions.length; itemIdx++) {
		var item = parsed.definitions[itemIdx];
		
		switch(item.kind) {
		case 'ObjectTypeDefinition':
			switch(item.name.value) {
				case 'Query':
				case 'Mutation':
					continue;
			}
		case 'EnumTypeDefinition':
		case 'ScalarTypeDefinition':
		case 'UnionTypeDefinition':
			break;
		default:
			continue;
		}
		
		var typeName = 'type'+item.name.value;
		
		dot += '  '+typeName+' [label="{<'+typeName+'>';
		
		switch(item.kind) {
		case 'ObjectTypeDefinition':
			dot += 'type '+item.name.value;
			
			for(var fieldIdx=0; fieldIdx<item.fields.length; fieldIdx++) {
				field = item.fields[fieldIdx];
				dot += '|<'+field.name.value+'> '+field.name.value + ': ' + printVariableType(field.type);
			}
			
			break;
		case 'EnumTypeDefinition':
			enums.push(item);
			dot += 'enum '+item.name.value;
			for(var valueIdx=0; valueIdx<item.values.length; valueIdx++) {
				value = item.values[valueIdx];
				dot +='|'+value.name.value;
			}
			break;
		case 'UnionTypeDefinition':
			dot += 'union '+item.name.value;
			for(var typeIdx=0; typeIdx<item.types.length; typeIdx++) {
				type = item.types[typeIdx];
				dot += '|<'+type.name.value+'>'+type.name.value;
			}
			break;
			
		case 'ScalarTypeDefinition':
			scalars.push(item);
			dot += 'scalar '+item.name.value;
			break;
		}
		
		dot += '}"];\n';
		
	}
	
	
	
	for(var itemIdx=0; itemIdx<parsed.definitions.length; itemIdx++) {
		var item = parsed.definitions[itemIdx];
		
		switch(item.kind) {
		case 'ObjectTypeDefinition':
			switch(item.name.value) {
				case 'Query':
				case 'Mutation':
					continue;
			}
		case 'UnionTypeDefinition':
			break;
		default:
			continue;
		}
		
		var typeName = 'type'+item.name.value;
		
		switch(item.kind) {
		case 'ObjectTypeDefinition':
			
			for(var fieldIdx=0; fieldIdx<item.fields.length; fieldIdx++) {
				field = item.fields[fieldIdx];
				//console.log(field);
				var baseType = getBaseType(field.type);
				if( ! isScalar(baseType) && ! isType(enums, baseType) && ! isType(scalars, baseType) ) {
					dot += typeName+':'+field.name.value + ' -> ';
					dot += 'type' + baseType.name.value + '\n';
				}
			}
			
			break;
		case 'UnionTypeDefinition':
			for(var typeIdx=0; typeIdx<item.types.length; typeIdx++) {
				type = item.types[typeIdx];
				dot += typeName+':'+type.name.value + ' -> ';
				dot += 'type' + type.name.value + '\n';
			}
			break;
		}
		
	}
	
	if(enums.length > 0) {
		dot += "{ rank=sink";
		for(var i=0; i<enums.length; i++) {
			dot += "; type"+enums[i].name.value;
		}
		dot += "}\n";
	}

	if(scalars.length > 0) {
		dot += "{ rank=min";
		for(var i=0; i<scalars.length; i++) {
			dot += "; type"+scalars[i].name.value;
		}
		dot += "}\n";
	}

	dot += "}"
	
	console.log(dot);


}




function printVariableType(type, html) {

	var html = (typeof html !== 'undefined') ?  html : false;

	var output = '';
	var notNullBaseType = false;
	if(type.kind == 'NonNullType') { 
		notNullBaseType = true;
		type = type.type;
	}
	
	var listType = false;
	var notNullListType = false;
	if(type.kind == 'ListType') { 
		listType = true;
		output += '[';
		type = type.type;
		
		if(type.kind == 'NonNullType') { 
			notNullListType = true;
			type = type.type;
		}
	}
	
	
	if(type.kind == 'NamedType') {
		if(isScalar(type)) {
			if(html) output += '<span class="scalarVariable">';
		} else {
			if(html) output += '<span class="typeVariable">';
		}
		
		output += type.name.value;
		if(html) output += '</span>';
	}
	
	if(listType) {
		if(notNullListType) {
			output += '!';
		}
		output += ']';
	}
	
	if(notNullBaseType) {
		output += '!';
	}
	
	return output;
}

function getBaseType(type) {
	if(type.kind == 'NonNullType') { 
		type = type.type;
	}
	if(type.kind == 'ListType') { 
		type = type.type;
		if(type.kind == 'NonNullType') { 
			type = type.type;
		}
	}
	
	return type;
}

function isScalar(type) {
	if(type.kind == 'NamedType') {
		switch(type.name.value) {
			case "ID":
			case "String":
			case "Boolean":
			case "Int":
			case "Float":
				return true;
		}
	}
	
	return false;
}

function isType(list, type) {
	for(var i=0; i<list.length; i++) {
		if(list[i].name.value == type.name.value) {
			return true;
		}
	}
	return false;
}


