from ursina import *
from panda3d.core import ShaderBuffer



app = Ursina()

buffer = ShaderBuffer("particles_buffer", 512, 512)


rain_shader = Shader(language=Shader.GLSL, 
                     vertex=open('rain.vert', 'r').read(),
                     fragment=open('rain.frag', 'r').read(),
                     default_input={
                        "aspect_ratio": camera.aspect_ratio,
                        "drop_size": Vec3(0.05, 0.03, 1),
                        "drops_color": color.white,
                        "particles_buffer": buffer,
                        "noise": load_texture("noise"),
                     }
                     ) 

camera.shader = rain_shader

arrow = Entity(model='arrow', color=color.white, rotation_z=180, collider='box')

EditorCamera()

def update():
    camera.set_shader_input("camera_p",camera.world_position)
    camera.set_shader_input("camera_f",camera.forward)
    camera.set_shader_input("camera_r",camera.right)
    camera.set_shader_input("camera_u",camera.up)
    

app.run()