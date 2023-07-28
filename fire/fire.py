from ursina import *

app = Ursina()

fire = Entity(model='cube', texture = "brick")

fire_shader = Shader(fragment=open("fire.frag").read())

fire.shader = fire_shader

start = time.time()

fire.set_shader_input("iTime",0)
fire.set_shader_input("resolution",4)

def update():
    fire.set_shader_input("iTime", time.time()-start)

EditorCamera()

app.run()