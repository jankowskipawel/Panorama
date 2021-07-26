let camera, scene, renderer;
let cameraSpeed = 0.1;

let isUserInteracting = false,
    onPointerDownMouseX = 0, onPointerDownMouseY = 0,
    lon = 0, onPointerDownLon = 0,
    lat = 0, onPointerDownLat = 0,
    phi = 0, theta = 0;

let planes=[];
const raycaster = new THREE.Raycaster();


init();
animate();

function init() {

    const container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );

    scene = new THREE.Scene();

    const geometry = new THREE.SphereGeometry( 500, 60, 40 );
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale( - 1, 1, 1 );

    const texture = new THREE.TextureLoader().load( 'pano.jpg' );
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    const mesh = new THREE.Mesh( geometry, material );


    scene.add( mesh );

    const geometry2 = new THREE.PlaneGeometry( 20, 20 );
    const material2 = new THREE.MeshBasicMaterial( {color: 0xFF8000, side: THREE.DoubleSide} );
    let plane = new THREE.Mesh( geometry2, material2 );
    plane.position.set(100,0,100)
    planes.push(plane);
    scene.add( plane );

    plane = new THREE.Mesh( geometry2, material2 );
    plane.position.set(50,50,100);
    planes.push(plane);
    scene.add( plane );

    planes.forEach(plane => {
        plane.lookAt(camera.position);
    });


    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    container.style.touchAction = 'none';
    container.addEventListener( 'pointerdown', onPointerDown );

    document.addEventListener( 'wheel', onDocumentMouseWheel );

    document.addEventListener( 'dragover', function ( event ) {

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';

    } );

    document.addEventListener( 'dragenter', function () {

        document.body.style.opacity = 0.5;

    } );

    document.addEventListener( 'dragleave', function () {

        document.body.style.opacity = 1;

    } );

    document.addEventListener( 'drop', function ( event ) {

        event.preventDefault();

        const reader = new FileReader();
        reader.addEventListener( 'load', function ( event ) {

            material.map.image.src = event.target.result;
            material.map.needsUpdate = true;

        } );
        reader.readAsDataURL( event.dataTransfer.files[ 0 ] );

        document.body.style.opacity = 1;

    } );

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onPointerDown( event ) {

    if ( event.isPrimary === false ) return;

    isUserInteracting = true;

    onPointerDownMouseX = event.clientX;
    onPointerDownMouseY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    document.addEventListener( 'pointermove', onPointerMove );
    document.addEventListener( 'pointerup', onPointerUp );

}

function onPointerMove( event ) {

    if ( event.isPrimary === false ) return;

    lon = ( onPointerDownMouseX - event.clientX ) * cameraSpeed + onPointerDownLon;
    lat = ( event.clientY - onPointerDownMouseY ) * cameraSpeed + onPointerDownLat;
    planes.forEach(plane => {
        plane.lookAt(camera.position);
    });
    let pos = toScreenPosition(planes[1], camera);
    document.getElementById("hotspot").style.transform = "translate("+ pos.x +"px, "+ pos.y +"px)";
}

function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return { 
        x: vector.x,
        y: vector.y
    };

};

function onPointerUp() {

    if ( event.isPrimary === false ) return;

    isUserInteracting = false;

    document.removeEventListener( 'pointermove', onPointerMove );
    document.removeEventListener( 'pointerup', onPointerUp );

}

function onDocumentMouseWheel( event ) {

    const fov = camera.fov + event.deltaY * 0.05;
    cameraSpeed += event.deltaY * 0.0001;
    camera.fov = THREE.MathUtils.clamp( fov, 10, 75 );
    cameraSpeed = THREE.MathUtils.clamp( cameraSpeed, 0.01, 0.1);

    camera.updateProjectionMatrix();

}

function animate() {

    requestAnimationFrame( animate );
    update();

}

function update() {

    if ( isUserInteracting === false ) {

    }

    lat = Math.max( - 85, Math.min( 85, lat ) );
    phi = THREE.MathUtils.degToRad( 90 - lat );
    theta = THREE.MathUtils.degToRad( lon );

    const x = 500 * Math.sin( phi ) * Math.cos( theta );
    const y = 500 * Math.cos( phi );
    const z = 500 * Math.sin( phi ) * Math.sin( theta );

    camera.lookAt( x, y, z );

    renderer.render( scene, camera );

}