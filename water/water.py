from ursina import *

app = Ursina()

water = Entity(model=Plane(subdivisions=(320,320)),scale=10)

water_shader = Shader(
vertex=open("water.vert").read()
,fragment=open("water.frag").read())

water.shader = water_shader


water.set_shader_input("resolution",32)
water.set_shader_input("displacementStrength",0.1)


EditorCamera()

app.run()