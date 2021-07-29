let camera, scene, renderer;
let cameraSpeed = 0.1;

let isUserInteracting = false,
    onPointerDownMouseX = 0, onPointerDownMouseY = 0,
    lon = 0, onPointerDownLon = 0,
    lat = 0, onPointerDownLat = 0,
    phi = 0, theta = 0;

let planes=[];
let hotspots = document.getElementsByClassName("hotspot");
let popups = [];

let imageUrl = document.getElementById("panorama-image-url").value;
init(imageUrl);
animate();
createHotspots();
updateHotspotsPositions()


function init(imageUrl) {

    const container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );

    scene = new THREE.Scene();

    const geometry = new THREE.SphereGeometry( 500, 60, 40 );
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale( - 1, 1, 1 );

    const texture = new THREE.TextureLoader().load( imageUrl );
    const material = new THREE.MeshBasicMaterial( { map: texture } );

    const mesh = new THREE.Mesh( geometry, material );


    scene.add( mesh );

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
    updateHotspotsPositions();
}

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
    updateHotspotsPositions();
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

}

function isInView(camera, object)
{
    camera.updateMatrix();
    camera.updateMatrixWorld();
    var frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));  

    // Your 3d point to check
    var pos = object.position;
    if (frustum.containsPoint(pos)) {
        return true;
    }
    return false;
}

function updateHotspotsPositions()
{
    for (let i = 0; i < planes.length; i++) 
    {
        planes[i].lookAt(camera.position);
        let pos = toScreenPosition(planes[i], camera);
        if(isInView(camera, planes[i]))
        {
            hotspots[i].classList.remove("hidden");
            hotspots[i].style.transform = "translate("+ pos.x +"px, "+ pos.y +"px)";
        }
        else
        {
            hotspots[i].classList.add("hidden");
        }
    }
}

function createHotspots()
{
    const geometry = new THREE.PlaneGeometry( 20, 20 );
    //change to Backside for invisible squares
    const material = new THREE.MeshBasicMaterial( {color: 0xFF8000, side: THREE.BackSide} );
    let plane = new THREE.Mesh( geometry, material );
    for (let i = 0; i < hotspots.length; i++)
    {
        plane = new THREE.Mesh( geometry, material );
        let pos = hotspots[i].children[0].value.split(',');
        plane.position.set(pos[0],pos[1],pos[2])
        planes.push(plane);
        scene.add(plane);
        if(hotspots[i].children.length==3)
        {
            popups.push(hotspots[i].children[2]);
        }
    }
}


function toggleVisibility(element)
{
    let parent = element.parentElement;
    let popup = parent.children[2];
    popups.forEach(ppp => {
        if(ppp!=popup)
        {
            ppp.classList.add("hidden");
        }
    });
    if(popup.classList.contains("hidden"))
    {
        popup.classList.remove("hidden");
    }
    else
    {
        popup.classList.add("hidden");
    }
    
}

function hideAllPopups()
{
    popups.forEach(ppp => {
        ppp.classList.add("hidden");
    });
}