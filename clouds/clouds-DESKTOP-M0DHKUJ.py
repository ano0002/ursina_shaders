from ursina import *

app = Ursina()

clouds_shader = Shader(language=Shader.GLSL, fragment=open('clouds.frag').read()
                       ,default_input={
                            'background':load_texture('sky_sunset'),                           
                       }
                    )


EditorCamera()


Entity(model="cube", texture="white_cube", color=color.red)
Entity(model="cube",position=(1,1,1), scale=.01)
Entity(model = "sphere", texture="white_cube", scale=1, color=color.yellow,y=1)


camera.shader = clouds_shader
camera.set_shader_input('camera_pos', camera.position)
camera.set_shader_input('camera_rot', camera.rotation)
camera.set_shader_input('camera_fov', camera.fov)
camera.set_shader_input("window_size", window.size)
def update():
    fov = camera.fov
    camera.set_shader_input('camera_pos', camera.world_position)
    camera.set_shader_input('camera_rot', camera.world_rotation)
    camera.set_shader_input('camera_fov', fov)
app.run()