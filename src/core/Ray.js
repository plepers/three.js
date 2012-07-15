/**
 * @author mr.doob / http://mrdoob.com/
 */

THREE.Ray = function ( origin, direction ) {

	this.origin = origin || new THREE.Vector3();
	this.direction = direction || new THREE.Vector3();

	var precision = 0.0001;

	this.setPrecision = function ( value ) {

		precision = value;

	};

	var a = new THREE.Vector3();
	var b = new THREE.Vector3();
	var c = new THREE.Vector3();
	var d = new THREE.Vector3();

    var origin_inv = new THREE.Vector3();
	var direction_inv = new THREE.Vector3();

	var vector = new THREE.Vector3();
	var normal = new THREE.Vector3();
	var intersectPoint = new THREE.Vector3();
	var point;

	this.intersectObject = function ( object ) {

		var intersect, intersects = [];

        origin_inv.copy( origin );
        direction_inv.copy( direction );

		if ( object instanceof THREE.Particle ) {

			var distance = distanceFromIntersection( this.origin, this.direction, object.matrixWorld.getPosition() );

			if ( distance > object.scale.x ) {

				return [];

			}

			intersect = {

				distance: distance,
				point: object.position,
				face: null,
				object: object

			};

			intersects.push( intersect );

		} else if ( object instanceof THREE.Mesh ) {

			// Checking boundingSphere

			var distance = distanceFromIntersection( this.origin, this.direction, object.matrixWorld.getPosition() );
			var scale = THREE.Frustum.__v1.set( object.matrixWorld.getColumnX().length(), object.matrixWorld.getColumnY().length(), object.matrixWorld.getColumnZ().length() );

			if ( distance > object.geometry.boundingSphere.radius * Math.max( scale.x, Math.max( scale.y, scale.z ) ) ) {

				return intersects;

			}

			// Checking faces

			var f, fl, face, dot, scalar,
			geometry = object.geometry,
			vertices = geometry.vertices,
			objMatrix;
            var invObjMtx = new THREE.Matrix4();
            invObjMtx.getInverse( object.matrixWorld );

            invObjMtx.multiplyVector3( origin_inv );
            invObjMtx.rotateAxis( direction_inv );

			object.matrixRotationWorld.extractRotation( object.matrixWorld );
            objMatrix = object.matrixWorld;

			for ( f = 0, fl = geometry.faces.length; f < fl; f ++ ) {

				face = geometry.faces[ f ];


				// determine if ray intersects the plane of the face
				// note: this works regardless of the direction of the face normal

				vector.x = face.centroid.x - origin_inv.x;
				vector.y = face.centroid.y - origin_inv.y;
				vector.z = face.centroid.z - origin_inv.z;

				normal = face.normal;
				dot = direction_inv.dot( normal );

				// bail if ray and plane are parallel

				if ( Math.abs( dot ) < precision ) continue;

				// calc distance to plane

				scalar = normal.dot( vector ) / dot;

				// if negative distance, then plane is behind ray

				if ( scalar < 0 ) continue;

                if ( object.doubleSided || ( object.flipSided ? dot > 0 : dot < 0 ) ) {

                    //intersectPoint.add( origin_inv, directionCopy.multiplyScalar( scalar ) );
                    intersectPoint.x = origin_inv.x + direction_inv.x*scalar;
                    intersectPoint.y = origin_inv.y + direction_inv.y*scalar;
                    intersectPoint.z = origin_inv.z + direction_inv.z*scalar;


                    if ( face instanceof THREE.Face3 ) {

                        a = vertices[ face.a ];
                        b = vertices[ face.b ];
                        c = vertices[ face.c ];

                        if ( pointInFace3( intersectPoint, a, b, c ) ) {

                            point = intersectPoint.clone();
                            objMatrix.multiplyVector3( point );

                            intersect = {

                                distance: origin.distanceTo( point ),
                                point: point,
                                face: face,
                                object: object

                            };

                            intersects.push( intersect );

                        }

                    } else if ( face instanceof THREE.Face4 ) {

                        a = vertices[ face.a ];
                        b = vertices[ face.b ];
                        c = vertices[ face.c ];
                        d = vertices[ face.d ];

                        if ( pointInFace4( intersectPoint, a, b, c, d ) ) {

                            //if ( pointInFace3( intersectPoint, b, d, a ) || pointInFace3( intersectPoint, b, d, c ) ) {
                            point = intersectPoint.clone();
                            objMatrix.multiplyVector3( point );

                            intersect = {

                                distance: origin.distanceTo( point ),
                                point: point,
                                face: face,
                                object: object

                            };

                            intersects.push( intersect );

                        }

                    }

                }

            }

		}

		return intersects;

	}

	this.intersectObjects = function ( objects ) {

		var intersects = [];

		for ( var i = 0, l = objects.length; i < l; i ++ ) {

			Array.prototype.push.apply( intersects, this.intersectObject( objects[ i ] ) );

		}

		intersects.sort( function ( a, b ) { return a.distance - b.distance; } );

		return intersects;

	};

	var v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
	var dot, intersect, distance;

	function distanceFromIntersection( origin, direction, position ) {

		v0.sub( position, origin );
		dot = v0.dot( direction );

		intersect = v1.add( origin, v2.copy( direction ).multiplyScalar( dot ) );
		distance = position.distanceTo( intersect );

		return distance;

	}

	// http://www.blackpawn.com/texts/pointinpoly/default.html

	var dot00, dot01, dot02, dot11, dot12, invDenom, u, v;

	function pointInFace3( p, a, b, c ) {

		v0.sub( c, a );
		v1.sub( b, a );
		v2.sub( p, a );

		dot00 = v0.dot( v0 );
		dot01 = v0.dot( v1 );
		dot02 = v0.dot( v2 );
		dot11 = v1.dot( v1 );
		dot12 = v1.dot( v2 );

		invDenom = 1 / ( dot00 * dot11 - dot01 * dot01 );
		u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
		v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

		return ( u >= 0 ) && ( v >= 0 ) && ( u + v < 1 );

	}

    function pointInFace4( p, a, b, c, d ) {

		v0.sub( c, a );
		v1.sub( b, a );
		v2.sub( p, a );

		dot00 = v0.dot( v0 );
		dot01 = v0.dot( v1 );
		dot02 = v0.dot( v2 );
		dot11 = v1.dot( v1 );
		dot12 = v1.dot( v2 );

		invDenom = 1 / ( dot00 * dot11 - dot01 * dot01 );
		u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
		v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

		if ( ( u >= 0 ) && ( v >= 0 ) && ( u + v < 1 ) ) return true;

        v0.sub( d, a );

        dot00 = v0.dot( v0 );
        dot01 = v0.dot( v1 );
        dot02 = v0.dot( v2 );

        invDenom = 1 / ( dot00 * dot11 - dot01 * dot01 );
        u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
        v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

        return ( u >= 0 ) && ( v >= 0 ) && ( u + v < 1 );

	}

};
