import random

from ursina import *
from ursina.shaders import basic_lighting_shader

from panda3d.core import Geom, GeomVertexArrayFormat, GeomVertexFormat, GeomVertexWriter, OmniBoundingVolume


from water.water import water_shader
from grass.main import instancing_shader



random.seed(0)
app = Ursina()
terrain = Entity(model = Terrain('heightmap'),scale=(100,10,100),texture='grass',shader=basic_lighting_shader)


sun = DirectionalLight(color=color.white)
sun.look_at(Vec3(1,-1,1))

clouds_shader = Shader(language=Shader.GLSL,
                       vertex=open('./clouds/clouds.vert').read(),
                       fragment=open('./clouds/clouds.frag').read(),
                       default_input= {
                           "aspect_ratio" : camera.aspect_ratio,
                           "cloud_height" : 10,
                           "threshold" : 0.7,
                           "sky_height" : 15,
                           "density" : -0.45,
                           "cloud_scale" : 10,
                           "wind_speed" : Vec2(0.1),
                          }
                       )

slider = Slider(min=-1, max=1, step=0.01, default=-0.45, position=(-.5, -.4), parent=camera.ui)
slider2 = Slider(min=1, max=100, step=0.01, default=10, position=(-.5, -.3), parent=camera.ui)

water = Entity(model=Plane(subdivisions=(1000,1000)),scale=(100,1,100),shader=water_shader)
water.set_shader_input("resolution",64)
water.set_shader_input("amplitude",2)
water.set_shader_input("speed",1)
water.set_shader_input("lightDir",Vec3(-1,0,-0.2).normalized())
water.set_shader_input("lightColor",color.white)
water.set_shader_input("waterColor",color.rgb(50,100,150))
water.set_shader_input("ambient",0.2)
water.set_shader_input("reflectionTexture",load_texture("skybox.jpg"))

grass_blade = Entity(model='quad')
grass_blade_2 = Entity(model='quad',rotation_y=45)
grass_blade_3 = Entity(model='quad',rotation_y=90)

grass = Entity()

grass_blade.parent = grass
grass_blade_2.parent = grass
grass_blade_3.parent = grass

grass.combine(auto_destroy=True)
grass.double_sided = True
grass.texture = 'grassblade'


def generate_grass(plane,grass,density=1,center=(0,0,0)):
    grass.shader = instancing_shader
    gnode = grass.find("**/+GeomNode").node()


    iformat = GeomVertexArrayFormat()
    iformat.setDivisor(1)
    iformat.addColumn("position", 3, Geom.NT_stdfloat, Geom.C_vector)
    iformat.addColumn("rotation", 4, Geom.NT_stdfloat, Geom.C_vector)
    iformat.addColumn("scale", 3, Geom.NT_stdfloat, Geom.C_vector)

    format = GeomVertexFormat(gnode.getGeom(0).getVertexData().getFormat())
    format.addArray(iformat)
    format = GeomVertexFormat.registerFormat(format)
    
    vdata = gnode.modifyGeom(0).modifyVertexData()
    vdata.setFormat(format)
    vdata.setNumRows(int(plane.scale_x*plane.scale_z*density*density))

    position = GeomVertexWriter(vdata, 'position')
    rotation = GeomVertexWriter(vdata, 'rotation')
    scale = GeomVertexWriter(vdata, 'scale')
    
    grass.position = plane.position+(0,0.5,0)
    grass.enable()
    for z in range(int(plane.scale_z*density)):
        for x in range(int(plane.scale_x*density)):
            rand = random.random()
            hit_info = terraincast(Vec3(plane.x-plane.scale_x/2+x/density+rand/2-0.25,
                                    plane.y+plane.scale_y,
                                    plane.z-plane.scale_z/2+z/density+rand/2-0.25),
                                    plane)
            if not hit_info or hit_info < 2:
                continue
            grass_pos = Vec3(plane.x-plane.scale_x/2+x/density+rand/2-0.25,
                                hit_info+0.5,
                                plane.z-plane.scale_z/2+z/density+rand/2-0.25)
            grass_rot = Quat()
            
            grass_rot.set_hpr((random.random()*360,180,0))

            position.add_data3(*grass_pos)
            rotation.add_data4(*grass_rot)
            scale.add_data3(1,rand/2-.25+1,1)
    
    grass.setInstanceCount(int(plane.scale_x*plane.scale_z*density*density))
    return vdata
    
grass_info = generate_grass(terrain,grass,2)

grass.node().setBounds(OmniBoundingVolume())
grass.node().setFinal(True)
grass.set_shader_input("self_pos",grass.position)
camera.shader = clouds_shader

camera.set_shader_input("light_color", sun.color)
camera.set_shader_input("ambient_strength", 0.3)
camera.set_shader_input("background_tex", load_texture("sky_sunset"))
camera.set_shader_input("window_size", window.size)
def update():
    water.set_shader_input("cameraDir",camera.world_rotation.normalized())
    water.set_shader_input("cameraPos",camera.world_position)
    
    camera.set_shader_input("camera_pos",camera.world_position)
    camera.set_shader_input("camera_forward",camera.forward)
    camera.set_shader_input("camera_right",camera.right)
    camera.set_shader_input("camera_up",camera.up)
    camera.set_shader_input("light_dir", sun.forward)
    camera.set_shader_input("density", slider.value)
    camera.set_shader_input("cloud_scale", slider2.value)
    
    
EditorCamera()
Sky(texture= 'skybox')
app.run()