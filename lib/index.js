var guessIndent = require( './guessIndent' );

var MagicString = function ( string ) {
	this.original = this.str = string;
	this.mappings = initMappings( string.length );

	this.indentStr = guessIndent( string );
};

MagicString.prototype = {
	append: function ( content ) {
		this.str += content;
		return this;
	},

	indent: function () {
		var self = this,
			mappings = this.mappings,
			indentStr = this.indentStr,
			pattern = /\n/g,
			match,
			inserts = [ 0 ],
			i;

		while ( match = pattern.exec( this.str ) ) {
			inserts.push( match.index + 1 );
		}

		this.str = indentStr + this.str.replace( pattern, '\n' + indentStr );

		inserts.forEach( function ( index, i ) {
			do {
				origin = self.locateOrigin( index++ );
			} while ( origin == null && index < self.str.length );

			adjust( mappings, origin, indentStr.length );
		});

		return this;
	},

	// get current location of character in original string
	locate: function ( character ) {
		var loc;

		if ( character < 0 || character >= this.mappings.length ) {
			throw new Error( 'Character is out of bounds' );
		}

		loc = this.mappings[ character ];
		return ~loc ? loc : null;
	},

	locateOrigin: function ( character ) {
		var i;

		if ( character < 0 || character >= this.str.length ) {
			throw new Error( 'Character is out of bounds' );
		}

		i = this.mappings.length;
		while ( i-- ) {
			if ( this.mappings[i] === character ) {
				return i;
			}
		}

		return null;
	},

	prepend: function ( content ) {
		this.str = content + this.str;
		adjust( this.mappings, 0, content.length );
		return this;
	},

	remove: function ( start, end ) {
		this.replace( start, end, '' );
		return this;
	},

	replace: function ( start, end, content ) {
		var i, len, firstChar, lastChar, d;

		firstChar = this.locate( start );
		lastChar = this.locate( end - 1 );

		if ( firstChar === null || lastChar === null ) {
			throw new Error( 'Cannot make overlapping replacements' );
		}

		this.str = this.str.substr( 0, firstChar ) + content + this.str.substring( lastChar + 1 );

		d = content.length - ( end - start );

		blank( this.mappings, start, end );
		adjust( this.mappings, end, d );
		return this;
	},

	toString: function () {
		return this.str;
	}
};

function adjust ( mappings, start, d ) {
	var i = mappings.length;
	while ( i-- > start ) {
		if ( ~mappings[i] ) {
			mappings[i] += d;
		}
	}
}

function initMappings ( i ) {
	var mappings = new Uint32Array( i );

	while ( i-- ) {
		mappings[i] = i;
	}

	return mappings;
}

function blank ( mappings, start, i ) {
	while ( i-- > start ) {
		mappings[i] = -1;
	}
}

module.exports = MagicString;
