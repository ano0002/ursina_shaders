from ursina import *
import random
from ursina.prefabs.first_person_controller import FirstPersonController
from panda3d.core import Geom, GeomVertexArrayFormat, GeomVertexFormat, GeomVertexWriter, GeomVertexReader

instancing_shader=Shader(name='instancing_shader', language=Shader.GLSL, vertex=open('instancing_shader.vert', 'r').read(),
                         fragment=open('instancing_shader.frag', 'r').read(), 
                         default_input = {
                                'wind_power': 0.3
                         })

app = Ursina(vsync=False)


grass_blade = Entity(model='quad',double_sided=True)
grass_blade_2 = Entity(model='quad',double_sided=True,rotation_y=45)
grass_blade_3 = Entity(model='quad',double_sided=True,rotation_y=90)

ograss = Entity()

grass_blade.parent = ograss
grass_blade_2.parent = ograss
grass_blade_3.parent = ograss

ograss.combine(auto_destroy=True)
ograss.double_sided = True
ograss.texture = 'grassblade'


ground = Entity(model='plane',texture="grass", scale=10,y=-.5, collider='box')

def generate_grass(plane,grass,density=0.1,center=(0,0,0)):
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
            grass_pos = Vec3(plane.x-plane.scale_x/2+x/density+random.random()/2-0.25,
                                0,
                                plane.z-plane.scale_z/2+z/density+random.random()/2-0.25)
            grass_rot = Quat()
            
            grass_rot.set_hpr((random.random()*360,180,0))

            position.add_data3(*grass_pos)
            rotation.add_data4(*grass_rot)
            scale.add_data3(1,rand/2-.25+1,1)
    
    grass.setInstanceCount(int(plane.scale_x*plane.scale_z*density*density))
    return vdata
    
def update_grass(vdata,pos):
    positionReader = GeomVertexReader(vdata, 'position')
    position = GeomVertexWriter(vdata, 'position')
    for i in range(vdata.getNumRows()):
        position.add_data3(positionReader.getData3f()+pos*Vec3(-1,1,-1))


fpc = FirstPersonController()
vdata = generate_grass(ground,ograss,2,fpc.position)

        
#EditorCamera()



last_pos = ograss.position
def update():
    global last_pos
    pos = Vec3()
    pos.xz = fpc.position.xz + camera.forward.xz * pow(15,(-camera.world_rotation_x+90)/90)
    pos.y = ground.y +.5
    ograss.position = pos
    ograss.set_shader_input("self_pos",ograss.position)
    ograss.set_shader_input("player_pos",fpc.position)
    
Sky()
app.run()
