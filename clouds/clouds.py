from ursina import *

app = Ursina()

clouds_shader = Shader(language=Shader.GLSL, fragment=open('clouds.frag').read()
                       ,default_input={
                            'background':load_texture('sky_sunset'),                           
                       }
                    )


EditorCamera()

Entity(model="cube", texture="white_cube", scale=1, color=color.azure)
Entity(model = "sphere", texture="white_cube", scale=1, color=color.yellow,y=1)

camera.shader = clouds_shader
camera.set_shader_input('camera_pos', camera.position)
camera.set_shader_input('camera_rot', camera.rotation)


def update():
    camera.set_shader_input('camera_pos', camera.position)
    camera.set_shader_input('camera_rot', camera.rotation)

app.run()