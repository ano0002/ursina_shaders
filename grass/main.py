from ursina import *
import random
from fpc import FirstPersonController
from panda3d.core import Geom, GeomVertexArrayFormat, GeomVertexFormat, GeomVertexWriter, GeomVertexReader

instancing_shader=Shader(name='instancing_shader', language=Shader.GLSL, vertex=open('instancing_shader.vert', 'r').read(),
                         fragment=open('instancing_shader.frag', 'r').read(), 
                         default_input = {
                                'wind_power': 0.3,
                                "fog_distance": 50,
                                "fog_color": (150,200,250)
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


ground = Entity(model=Terrain("Heightmap"),color= color.rgb(0,154,0), scale=(100,2,100),y=-.5)

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
    offset_scale = 1
    for z in range(int(plane.scale_z*density)):
        for x in range(int(plane.scale_x*density)):
            rand = random.random()
            hit_info = terraincast(Vec3(plane.x-plane.scale_x/2+x/density+rand/offset_scale-1/(offset_scale*2),
                                    ground.y+ground.scale_y,
                                    plane.z-plane.scale_z/2+z/density+rand/offset_scale-1/(offset_scale*2)),
                                    ground)
            if not hit_info:
                continue
            grass_pos = Vec3(plane.x-plane.scale_x/2+x/density+rand/offset_scale-1/(offset_scale*2),
                                hit_info,
                                plane.z-plane.scale_z/2+z/density+rand/offset_scale-1/(offset_scale*2))
            grass_rot = Quat()
            
            grass_rot.set_hpr((random.random()*360,180,0))

            position.add_data3(*grass_pos)
            rotation.add_data4(*grass_rot)
            scale.add_data3(1,rand/2-.25+1,1)
    
    grass.setInstanceCount(int(plane.scale_x*plane.scale_z*density*density))
    return vdata
    
fpc = FirstPersonController(ground = ground)
generate_grass(ground,ograss,3,fpc.position)

        
#EditorCamera()



def update():
    pos = Vec3()
    pos.xz = fpc.position.xz + camera.forward.xz * pow(15,(-camera.world_rotation_x+90)/90)
    pos.y = ground.y +.5
    ograss.position = pos
    ograss.set_shader_input("self_pos",ograss.position)
    ograss.set_shader_input("cam_pos",camera.position)



Sky()
app.run()
