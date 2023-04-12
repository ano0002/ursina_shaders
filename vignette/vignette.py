from ursina import *

app = Ursina()

vignetting_shader = Shader(fragment=open("vignette.frag").read(),
default_input={ 
               'vignette_distance': 0.5,
               'vignette_color': (0,0,0,1),
               'vignette_density': 1
            })

e = Entity(model='sphere', color=color.yellow)
e = Entity(model='cube', y=-1)
camera.shader = vignetting_shader



EditorCamera()

app.run()