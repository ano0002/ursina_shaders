from ursina import *
import random
from ursina.prefabs.first_person_controller import FirstPersonController
from panda3d.core import Geom, GeomVertexArrayFormat, GeomVertexFormat, GeomVertexWriter, GeomVertexData,loadPrcFileData


instancing_shader=Shader(name='instancing_shader', language=Shader.GLSL, vertex=open('instancing_shader.vert', 'r').read(),
                         fragment=open('instancing_shader.frag', 'r').read(),
                         default_input={
                            'texture_scale' : Vec2(1,1),
                            'texture_offset' : Vec2(0.0, 0.0)
                        })

app = Ursina()


grass_blade = Entity(model='quad',double_sided=True)
grass_blade_2 = Entity(model='quad',double_sided=True,rotation_y=45)
grass_blade_3 = Entity(model='quad',double_sided=True,rotation_y=90)

ograss = Entity()

grass_blade.parent = ograss
grass_blade_2.parent = ograss
grass_blade_3.parent = ograss

ograss.combine(auto_destroy=True)
ograss.double_sided = True
ograss.texture = 'grass'


ground = Entity(model='plane', scale=10,y=-.5, collider='box', color=color.rgb(25,100,0))

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
    
    blades = []
    grass.position = plane.position+(0,0.5,0)
    grass.enable()
    for z in range(int(plane.scale_z*density)):
        for x in range(int(plane.scale_x*density)):
            rand = random.random()
            grass_pos = Vec3(plane.x-plane.scale_x/2+x/density+random.random()/2-0.25,
                                0,
                                plane.z-plane.scale_z/2+z/density+random.random()/2-0.25)
            grass_rot = Entity(rotation=Vec3(0,rand*360,180))

            position.add_data3(*grass_pos)
            rotation.add_data4(grass_rot.quaternion)
            destroy(grass_rot)
            scale.add_data3(1,rand/2-.25+1,1)
    
    grass.setInstanceCount(int(plane.scale_x*plane.scale_z*density*density))
    
    return blades



fpc = FirstPersonController()
grass = generate_grass(ground,ograss,2,fpc.position)

        
EditorCamera()

print(len(ograss.model.vertices) * len(grass))

app.run()
